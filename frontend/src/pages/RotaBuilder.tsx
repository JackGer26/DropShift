import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchStaff } from '../services/staff.service';
import { fetchTemplates } from '../services/template.service';
import { Staff } from '../types/staff';
import { RotaTemplate } from '../types/template';
import { RotaDay, Rota } from '../types/rota';
import { StaffCard } from '../components/rota/StaffCard';
import ShiftSlot from '../components/rota/ShiftSlot';
import { createRota as createRotaApi, updateRota as updateRotaApi, fetchRotas, copyPreviousWeekRota, deleteRota as deleteRotaApi } from '../services/rota.service';
import { applyAssignment, calculateWeeklyHours, getSuggestedStaff, MAX_WEEKLY_HOURS } from '../domain/scheduling';
import type { AssignmentResult } from '../domain/scheduling';
import { getStartOfWeek, getNextWeek, getPreviousWeek } from '../utils/weekUtils';
import { formatWeekDateLong } from '../utils/rotaUtils';

export function RotaBuilder() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<RotaTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<RotaTemplate | null>(null);
  const [rotaDays, setRotaDays] = useState<RotaDay[]>([]);
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [selectedRotaId, setSelectedRotaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [tempError, setTempError] = useState<string | null>(null);
  const [selectedShift, setSelectedShift] = useState<{ shiftTemplateId: string; dayOfWeek: number } | null>(null);

  // Week state: start date of the current week (Monday)
  const [weekStartDate, setWeekStartDate] = useState(
    getStartOfWeek(new Date())
  );

  // Calculate weekly hours for all staff in the current rota
  const weeklyHours: Map<string, number> = calculateWeeklyHours(rotaDays);

  // MAX_WEEKLY_HOURS is imported from domain/scheduling

  // Fetch data (staff, templates, rotas) on mount and when weekStartDate changes
  useEffect(() => {
    // No longer generate random shift IDs; only use backend-provided ObjectId IDs
    function ensureShiftIds(template: RotaTemplate): RotaTemplate {
      return template;
    }

    async function loadData() {
      try {
        setLoading(true);
        const [staffData, templateData, rotasData] = await Promise.all([
          fetchStaff(),
          fetchTemplates(),
          fetchRotas(weekStartDate),
        ]);
        setStaff(staffData);
        setTemplates(templateData.map(ensureShiftIds));
        setRotas(rotasData);
        setError(null);
        // Only reset selectedRotaId if the rota is not in the new week
        if (selectedRotaId) {
          const stillExists = rotasData.some(r => String(r.id || (r as any)._id) === String(selectedRotaId));
          if (!stillExists) setSelectedRotaId(null);
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [weekStartDate]);

  // Load a rota by Rota object, fetch its template, rebuild rotaDays, and apply assignments
  async function loadRotaFromObject(rota: Rota) {
    // Backend model: rota.days = [{ dayOfWeek, assignments: [{ staffId, shiftTemplateId }] }]
    // Frontend expects: rotaDays = [{ dayOfWeek, shifts: [{...shift, assignedStaffIds: [] }] }]
    if (!rota || !rota.templateId) return;
    setSelectedRotaId(rota.id || (rota as any)._id || null);
    setSelectedTemplateId(rota.templateId);
    // Convert both to strings for comparison to handle ObjectId vs string mismatch
    const template = templates.find(t => String(t._id) === String(rota.templateId)) || null;
    if (!template) {
      setTempError(`⚠️ Template not found for this rota. The template (${rota.templateId}) may have been deleted. Please use the Delete button to remove this rota.`);
      console.error('Template not found. Looking for:', rota.templateId, 'Available templates:', templates.map(t => t._id));
      // Don't return - allow the UI to render so user can delete the broken rota
      setRotaDays([]); // Clear any existing rota days
      return;
    }
    // Map: dayOfWeek -> assignments[]
    const assignmentsByDay = new Map();
    for (const day of (rota.days || [])) {
      assignmentsByDay.set(day.dayOfWeek, Array.isArray((day as any).assignments) ? (day as any).assignments : []);
    }
    // Build rotaDays from template, fill assignedStaffIds from assignments
    const rotaDays: RotaDay[] = template.days.map(templateDay => {
      const assignments = assignmentsByDay.get(templateDay.dayOfWeek) || [];
      return {
        dayOfWeek: templateDay.dayOfWeek,
        shifts: (templateDay.shifts || []).map(shift => {
          // Find all staff assigned to this shiftTemplateId
          const assignedStaffIds = assignments
            .filter((a: any) => String(a.shiftTemplateId) === String(shift.id))
            .map((a: any) => String(a.staffId));
          return {
            ...shift,
            id: shift.id,
            shiftTemplateId: shift.id,
            assignedStaffIds,
          };
        })
      };
    });
    setRotaDays(rotaDays);
  }

  useEffect(() => {
    const found = templates.find(t => t._id === selectedTemplateId);
    setSelectedTemplate(found || null);
    // Only reset rotaDays from template if no rota is selected (i.e., user is starting a new rota from template)
    if (found && !selectedRotaId) {
      // Convert template.days to RotaDay[] with RotaShift[] (ensure assignedStaffIds exists and shiftTemplateId is present)
      const rotaDays = found.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        shifts: (day.shifts || []).map(shift => ({
          ...shift,
          id: shift.id, // ensure id is present for rendering
          shiftTemplateId: shift.id, // use shift.id as shiftTemplateId
          assignedStaffIds: [],
        })),
      }));
      setRotaDays(rotaDays);
    } else if (!found) {
      setRotaDays([]);
    }
  }, [selectedTemplateId, templates, selectedRotaId]);

  function handleDragEnd(event: DragEndEvent) {

    setActiveId(null);
    const staffData = (event.active.data?.current as { staff?: Staff })?.staff;
    const shiftTemplateId = event.over?.id as string | undefined;
    if (!staffData || !shiftTemplateId) return;

    setRotaDays(prevDays => {
      const outcome: AssignmentResult = applyAssignment(staffData, shiftTemplateId, prevDays);

      if (!outcome.success) {
        if (outcome.reason === 'OVERLAPPING_SHIFT') {
          setTimeout(() => {
            setTempError('Staff member is already assigned to overlapping shift');
            setTimeout(() => setTempError(null), 2500);
          }, 0);
        }
        return prevDays;
      }

      if (outcome.warnings.includes('EXCEEDS_WEEKLY_HOURS')) {
        setTimeout(() => alert('Warning: exceeds weekly hour limit'), 0);
      }

      return outcome.updatedDays;
    });
  }

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  // Type for saveRota params
  type SaveRotaParams = {
    locationId: string;
    templateId: string;
    rotaDays: RotaDay[];
  };

  // Save rota to backend
  async function saveRota({ locationId, templateId, rotaDays }: SaveRotaParams): Promise<void> {
    if (!locationId || !templateId || !rotaDays) {
      alert('Missing required parameters for saving rota');
      return;
    }

    // Helper to check for valid MongoDB ObjectId
    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

    if (!isValidObjectId(locationId) || !isValidObjectId(templateId)) {
      alert('Invalid locationId or templateId. Please check your template data.');
      return;
    }


    // Backend expects: days: [{ dayOfWeek, assignments: [{ staffId, shiftTemplateId }] }]
    const template = templates.find(t => t._id === templateId);
    let foundInvalid = false;
    const days = (template ? template.days : rotaDays).map(templateDay => {
      const rotaDay = rotaDays.find(rd => rd.dayOfWeek === templateDay.dayOfWeek);
      // Collect assignments for this day
      const assignments: { staffId: string, shiftTemplateId: string }[] = [];
      if (rotaDay) {
        for (const shift of rotaDay.shifts) {
          for (const staffId of shift.assignedStaffIds || []) {
            // Only allow valid ObjectIds for backend
            if (
              isValidObjectId(staffId) &&
              isValidObjectId(shift.shiftTemplateId)
            ) {
              assignments.push({ staffId: String(staffId), shiftTemplateId: String(shift.shiftTemplateId) });
            } else {
              foundInvalid = true;
            }
          }
        }
      }
      return {
        dayOfWeek: templateDay.dayOfWeek,
        assignments,
      };
    });
    if (foundInvalid) {
      alert('Some staff or shift IDs are not valid ObjectIds. Assignments with invalid IDs will not be saved. Please check your data.');
    }

    const payload = {
      locationId: String(locationId),
      templateId: String(templateId),
      weekStartDate, // Use selected week
      status: 'draft' as 'draft',
      days,
    };

    console.log('Sending rota payload:', payload);

    try {
      let response;
      let rotaId: string;
      if (selectedRotaId) {
        response = await updateRotaApi(selectedRotaId, payload as any);
        rotaId = response.id || (response as any)._id;
        console.log('Rota updated:', response);
      } else {
        response = await createRotaApi(payload as any);
        rotaId = response.id || (response as any)._id;
        console.log('Rota created:', response);
      }
      // Refresh rota list after saving (for current week)
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);
      setSelectedRotaId(rotaId);
      // Optionally reload the rota into the builder
      const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === rotaId);
      if (updatedRota) {
        await loadRotaFromObject(updatedRota);
      }
      alert('Draft rota saved.');
    } catch (error) {
      console.error('Failed to save rota:', error);
      alert('Failed to save rota. See console for details.');
    }
  }

  // Publish rota to backend
  async function publishRota() {
    if (!selectedRotaId) {
      alert('No rota selected to publish.');
      return;
    }
    try {
      // Find the rota to publish
      const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (!rota) {
        alert('Selected rota not found.');
        return;
      }
      // Prepare payload for publishing (set status to 'published' as correct type)
      const payload = {
        ...rota,
        status: 'published' as 'published',
      };
      await updateRotaApi(selectedRotaId, payload);
      // Refresh rota list after publishing
      const rotasData = await fetchRotas();
      setRotas(rotasData);
      // Reload the just-published rota into the builder to avoid blank page
      const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (updatedRota) {
        await loadRotaFromObject(updatedRota);
      }
      alert('Rota published successfully.');
    } catch (error) {
      console.error('Failed to publish rota:', error);
      alert('Failed to publish rota. See console for details.');
    }
  }

  // Copy previous week's rota
  async function handleCopyPreviousWeek() {
    try {
      // Validate template is selected
      if (!selectedTemplate || !selectedTemplateId) {
        alert('Please select a template first.');
        return;
      }

      const locationId = selectedTemplate.locationId;
      if (!locationId || locationId.length !== 24) {
        alert('Selected template is missing a valid locationId.');
        return;
      }

      // Check if rota already exists for current week
      const existingRota = rotas.find(r => r.weekStartDate === weekStartDate);
      if (existingRota) {
        alert(`A rota already exists for this week (${weekStartDate}). Please delete or select it instead.`);
        return;
      }

      // Confirm action with user
      if (!window.confirm(`Copy previous week's rota to ${weekStartDate}?`)) {
        return;
      }

      // Call API to copy previous week
      const response = await copyPreviousWeekRota(locationId, weekStartDate);

      // Refresh rotas list for current week
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);

      // Load the newly created rota
      if (response.rota) {
        await loadRotaFromObject(response.rota);
      }

      alert(`Successfully copied rota from ${response.copiedFrom.weekStartDate}!`);
    } catch (error: any) {
      console.error('Failed to copy previous week:', error);

      // Handle specific error cases
      if (error.response?.status === 404) {
        alert('No rota found for the previous week. Please create one manually.');
      } else if (error.response?.status === 409) {
        alert('A rota already exists for this week.');
      } else {
        alert(`Failed to copy previous week's rota: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  // Delete a rota (draft or published)
  async function handleDeleteRota(rotaId: string, status: 'draft' | 'published') {
    try {
      // Confirm deletion
      const confirmMessage = status === 'published'
        ? 'Are you sure you want to delete this PUBLISHED rota? This action cannot be undone and will affect staff schedules!'
        : 'Are you sure you want to delete this draft rota?';

      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Delete the rota
      await deleteRotaApi(rotaId);

      // Refresh rotas list
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);

      // Clear selection if deleted rota was selected
      if (selectedRotaId === rotaId) {
        setSelectedRotaId(null);
        setRotaDays([]);
      }

      alert(`${status === 'published' ? 'Published' : 'Draft'} rota deleted successfully.`);
    } catch (error: any) {
      console.error('Failed to delete rota:', error);
      alert(`Failed to delete rota: ${error.response?.data?.message || error.message}`);
    }
  }

  // Editing is disabled if loading, error, or selected rota is published
  const selectedRota = selectedRotaId ? rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId)) : null;
  const isEditingDisabled = loading || !!error || (selectedRota && selectedRota.status === 'published');

  if (loading) {
    return <div>Loading rota builder...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!staff.length && !templates.length) {
    return <div>No staff or templates found.</div>;
  }

  // Determine current rota status
  const rotaStatus = (() => {
    if (selectedRotaId) {
      const rota = rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId));
      return rota?.status || 'draft';
    }
    return 'draft';
  })();

  return (
    <>
      {tempError && (
        <div style={{ color: 'red', marginBottom: 12, fontWeight: 'bold' }}>{tempError}</div>
      )}
      {/* Week Navigation Controls (no styling) */}
      <div>
        <button onClick={() => setWeekStartDate(getPreviousWeek(weekStartDate))}>Previous Week</button>
        <span> Week of {formatWeekDateLong(weekStartDate)} </span>
        <button onClick={() => setWeekStartDate(getNextWeek(weekStartDate))}>Next Week</button>
      </div>
      {rotaStatus === 'draft' && !isEditingDisabled ? (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left panel: StaffPool */}
            <div style={{ minWidth: 200 }}>
              <h3>Staff Pool</h3>
              {staff.length === 0 ? (
                <div>No staff found.</div>
              ) : (
                staff.map(s => (
                  <StaffCard key={s._id} staff={s} draggable={rotaStatus === 'draft'} />
                ))
              )}
              <DragOverlay>
                {activeId ? (
                  (() => {
                    const draggedStaff = staff.find(s => (s.id || s._id) === activeId);
                    return draggedStaff ? <StaffCard staff={draggedStaff} /> : null;
                  })()
                ) : null}
              </DragOverlay>
            </div>

            {/* Right panel: RotaGrid */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 'bold', marginBottom: 8 }}>
                Status: <span style={{ color: String(rotaStatus) === 'published' ? 'green' : 'orange' }}>
                  {String(rotaStatus) === 'published' ? 'Published' : 'Draft'}
                </span>
              </h3>
              <h3>Rota Builder</h3>

              {/* Separate dropdowns for published rotas, draft rotas, and rota templates */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'flex-end' }}>
                <label>
                  Published Rotas:
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'published') ? selectedRotaId : ''}
                      onChange={async e => {
                        const rotaId = e.target.value;
                        setSelectedRotaId(rotaId || null);
                        const rota = rotas.find(r => String(r.id || (r as any)._id) === String(rotaId) && r.status === 'published');
                        if (rota) await loadRotaFromObject(rota);
                      }}
                    >
                      <option value="">Select published rota</option>
                      {rotas
                        .filter(r => r.status === 'published' && r.weekStartDate === weekStartDate)
                        .map(r => {
                          const rotaId = r.id || (r as any)._id;
                          const rotaLabel = (typeof r === 'object' && 'name' in r && r.name)
                            ? r.name
                            : (typeof r === 'object' && 'label' in r && r.label)
                            ? (r as any).label
                            : rotaId;
                          return (
                            <option key={rotaId} value={rotaId}>
                              {rotaLabel}
                            </option>
                          );
                        })}
                    </select>
                    {selectedRota && selectedRota.status === 'published' && (
                      <button
                        onClick={() => handleDeleteRota(selectedRotaId!, 'published')}
                        style={{ backgroundColor: '#d32f2f', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete this published rota"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </label>
                {/* Draft rotas dropdown for current week */}
                <label>
                  Draft Rotas:
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select
                      value={selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'draft') ? selectedRotaId : ''}
                      onChange={async e => {
                        const rotaId = e.target.value;
                        setSelectedRotaId(rotaId || null);
                        const rota = rotas.find(r => String(r.id || (r as any)._id) === String(rotaId) && r.status === 'draft');
                        if (rota) await loadRotaFromObject(rota);
                      }}
                    >
                      <option value="">Select draft rota</option>
                      {rotas
                        .filter(r => r.status === 'draft' && r.weekStartDate === weekStartDate)
                        .map(r => {
                          const rotaId = r.id || (r as any)._id;
                          const rotaLabel = (typeof r === 'object' && 'name' in r && r.name)
                            ? r.name
                            : (typeof r === 'object' && 'label' in r && r.label)
                            ? (r as any).label
                            : rotaId;
                          return (
                            <option key={rotaId} value={rotaId}>
                              {rotaLabel}
                            </option>
                          );
                        })}
                    </select>
                    {selectedRota && selectedRota.status === 'draft' && (
                      <button
                        onClick={() => handleDeleteRota(selectedRotaId!, 'draft')}
                        style={{ backgroundColor: '#f57c00', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        title="Delete this draft rota"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </label>
                {/* Draft rotas dropdown removed as requested */}
                <label>
                  Rota Templates:
                  <select
                    value={selectedTemplateId || ''}
                    onChange={e => {
                      const templateId = e.target.value;
                      setSelectedTemplateId(templateId);
                      setSelectedRotaId(null); // Clear rota selection when picking a template
                    }}
                  >
                    <option value="">Select template</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name || t._id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                onClick={() => {
                  if (!selectedTemplateId || !selectedTemplate) {
                    alert('Please select a template.');
                    return;
                  }
                  if (!selectedTemplate.locationId || selectedTemplate.locationId.length !== 24) {
                    alert('Template is missing a valid locationId.');
                    return;
                  }
                  saveRota({ locationId: selectedTemplate.locationId, templateId: selectedTemplateId, rotaDays });
                }}
                disabled={!!isEditingDisabled}
              >
                Save Draft
              </button>

              {/* Copy Previous Week button - show unless published rota exists for current week */}
              {!rotas.some(r => r.weekStartDate === weekStartDate && r.status === 'published') && (
                <button
                  onClick={handleCopyPreviousWeek}
                  style={{ marginLeft: '8px', backgroundColor: '#4CAF50' }}
                  disabled={!selectedTemplate}
                  title={!selectedTemplate ? 'Select a template first' : 'Copy assignments from previous week'}
                >
                  Copy Previous Week
                </button>
              )}

              {/* Publish button - disabled when rota is already published */}
              <button
                onClick={async () => {
                  if (!selectedRotaId) {
                    alert('No rota selected to publish.');
                    return;
                  }
                  try {
                    const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
                    if (!rota) {
                      alert('Selected rota not found.');
                      return;
                    }
                    const payload = {
                      ...rota,
                      status: 'published' as 'published',
                      weekStartDate,
                    };
                    await updateRotaApi(selectedRotaId, payload);
                    const rotasData = await fetchRotas(weekStartDate);
                    setRotas(rotasData);
                    const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
                    if (updatedRota) {
                      await loadRotaFromObject(updatedRota);
                    }
                    alert('Rota published successfully.');
                  } catch (error) {
                    console.error('Failed to publish rota:', error);
                    alert('Failed to publish rota. See console for details.');
                  }
                }}
                disabled={String(rotaStatus) === 'published'}
                title={String(rotaStatus) === 'published' ? 'This rota is already published' : 'Publish this rota'}
              >
                Publish
              </button>

              {/* Always show rota grid */}
              {rotaDays.length > 0 ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {rotaDays.map(day => (
                    <div key={day.dayOfWeek} style={{ border: '1px solid #ccc', padding: 8 }}>
                      <h4>Day {day.dayOfWeek}</h4>
                      {Array.isArray(day.shifts) && day.shifts.length > 0 ? (
                        day.shifts.map(shift => (
                          <div
                            key={shift.id}
                            onClick={() => setSelectedShift({ shiftTemplateId: shift.shiftTemplateId || shift.id, dayOfWeek: day.dayOfWeek })}
                            style={{ cursor: 'pointer' }}
                          >
                            <ShiftSlot
                              shift={shift}
                              staff={staff}
                              dayOfWeek={day.dayOfWeek}
                            />
                          </div>
                        ))
                      ) : (
                        <div>No shifts.</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div>Select a template to view rota grid.</div>
              )}
            </div>
          </div>
        </DndContext>
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* Left panel: StaffPool */}
          <div style={{ minWidth: 200 }}>
            <h3>Staff Pool</h3>
            {staff.length === 0 ? (
              <div>No staff found.</div>
            ) : (
              staff.map(s => (
                <StaffCard key={s._id} staff={s} draggable={false} />
              ))
            )}
          </div>

          {/* Right panel: RotaGrid */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: 8 }}>
              Status: <span style={{ color: String(rotaStatus) === 'published' ? 'green' : 'orange' }}>
                {String(rotaStatus) === 'published' ? 'Published' : 'Draft'}
              </span>
            </h3>
            <h3>Rota Builder</h3>

            {/* Separate dropdowns for published rotas, draft rotas, and rota templates */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'flex-end' }}>
              <label>
                Published Rotas:
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'published') ? selectedRotaId : ''}
                    onChange={async e => {
                      const rotaId = e.target.value;
                      setSelectedRotaId(rotaId || null);
                      const rota = rotas.find(r => String(r.id || (r as any)._id) === String(rotaId) && r.status === 'published');
                      if (rota) await loadRotaFromObject(rota);
                    }}
                  >
                    <option value="">Select published rota</option>
                    {rotas.filter(r => r.status === 'published').map(r => {
                      const rotaId = r.id || (r as any)._id;
                      const rotaLabel = (typeof r === 'object' && 'name' in r && r.name)
                        ? r.name
                        : (typeof r === 'object' && 'label' in r && r.label)
                        ? (r as any).label
                        : rotaId;
                      return (
                        <option key={rotaId} value={rotaId}>
                          {rotaLabel}
                        </option>
                      );
                    })}
                  </select>
                  {selectedRota && selectedRota.status === 'published' && (
                    <button
                      onClick={() => handleDeleteRota(selectedRotaId!, 'published')}
                      style={{ backgroundColor: '#d32f2f', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      title="Delete this published rota"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </label>
              {/* Draft rotas dropdown */}
              <label>
                Draft Rotas:
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'draft') ? selectedRotaId : ''}
                    onChange={async e => {
                      const rotaId = e.target.value;
                      setSelectedRotaId(rotaId || null);
                      const rota = rotas.find(r => String(r.id || (r as any)._id) === String(rotaId) && r.status === 'draft');
                      if (rota) await loadRotaFromObject(rota);
                    }}
                  >
                    <option value="">Select draft rota</option>
                    {rotas.filter(r => r.status === 'draft').map(r => {
                      const rotaId = r.id || (r as any)._id;
                      const rotaLabel = (typeof r === 'object' && 'name' in r && r.name)
                        ? r.name
                        : (typeof r === 'object' && 'label' in r && r.label)
                        ? (r as any).label
                        : rotaId;
                      return (
                        <option key={rotaId} value={rotaId}>
                          {rotaLabel}
                        </option>
                      );
                    })}
                  </select>
                  {selectedRota && selectedRota.status === 'draft' && (
                    <button
                      onClick={() => handleDeleteRota(selectedRotaId!, 'draft')}
                      style={{ backgroundColor: '#f57c00', color: 'white', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      title="Delete this draft rota"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </label>
              <label>
                Rota Templates:
                <select
                  value={selectedTemplateId || ''}
                  onChange={e => {
                    const templateId = e.target.value;
                    setSelectedTemplateId(templateId);
                    setSelectedRotaId(null); // Clear rota selection when picking a template
                  }}
                >
                  <option value="">Select template</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name || t._id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              onClick={() => {
                if (!selectedTemplateId || !selectedTemplate) {
                  alert('Please select a template.');
                  return;
                }
                if (!selectedTemplate.locationId || selectedTemplate.locationId.length !== 24) {
                  alert('Template is missing a valid locationId.');
                  return;
                }
                saveRota({ locationId: selectedTemplate.locationId, templateId: selectedTemplateId, rotaDays });
              }}
              disabled={String(rotaStatus) === 'published'}
            >
              Save Draft
            </button>

            {/* Publish button - disabled when rota is already published */}
            <button
              onClick={publishRota}
              disabled={String(rotaStatus) === 'published'}
              title={String(rotaStatus) === 'published' ? 'This rota is already published' : 'Publish this rota'}
            >
              Publish
            </button>

            {/* Copy Previous Week button - show unless published rota exists for current week */}
            {!rotas.some(r => r.weekStartDate === weekStartDate && r.status === 'published') && (
              <button
                onClick={handleCopyPreviousWeek}
                style={{ marginLeft: '8px', backgroundColor: '#4CAF50' }}
                disabled={!selectedTemplate}
                title={!selectedTemplate ? 'Select a template first' : 'Copy assignments from previous week'}
              >
                Copy Previous Week
              </button>
            )}

            {/* Always show rota grid */}
            {rotaDays.length > 0 ? (
              <div style={{ display: 'flex', gap: 8 }}>
                {rotaDays.map(day => (
                  <div key={day.dayOfWeek} style={{ border: '1px solid #ccc', padding: 8 }}>
                    <h4>Day {day.dayOfWeek}</h4>
                    {Array.isArray(day.shifts) && day.shifts.length > 0 ? (
                      day.shifts.map(shift => (
                        <div
                          key={shift.id}
                          onClick={() => setSelectedShift({ shiftTemplateId: shift.shiftTemplateId || shift.id, dayOfWeek: day.dayOfWeek })}
                          style={{ cursor: 'pointer' }}
                        >
                          <ShiftSlot
                            shift={shift}
                            staff={staff}
                          />
                        </div>
                      ))
                    ) : (
                      <div>No shifts.</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>Select a template to view rota grid.</div>
            )}
          </div>
        </div>
      )}
      {/* Suggestion Panel */}
      {selectedShift && (() => {
        const { shiftTemplateId, dayOfWeek } = selectedShift;
        const day = rotaDays.find(d => d.dayOfWeek === dayOfWeek);
        if (!day) return <div>No suggestions.</div>;
        const shift = day.shifts.find(s => (s.shiftTemplateId || s.id) === shiftTemplateId);
        if (!shift) return <div>No suggestions.</div>;
        const suggestions = getSuggestedStaff(shift, dayOfWeek, rotaDays, staff);
        const hoursMap = calculateWeeklyHours(rotaDays);
        if (!suggestions.length) return <div>No suggestions.</div>;
        return (
          <div>
            <div>Suggested Staff:</div>
            {suggestions.map(s => {
              const hours = hoursMap.get(s._id) ?? 0;
              let warning = '';
              if (hours >= MAX_WEEKLY_HOURS) {
                warning = ' (Over limit)';
              } else if (hours >= 0.9 * MAX_WEEKLY_HOURS) {
                warning = ' (Near limit)';
              }
              return (
                <div key={s._id}>
                  <span>{s.name} (Hours: {hours}{warning && <span style={{color: hours >= MAX_WEEKLY_HOURS ? 'red' : 'orange', fontWeight: 'bold'}}>{warning}</span>})</span>
                  <button
                    onClick={() => {
                      const outcome = applyAssignment(s, shiftTemplateId, rotaDays);
                      if (!outcome.success) return;
                      if (outcome.warnings.includes('EXCEEDS_WEEKLY_HOURS')) {
                        alert('Warning: exceeds weekly hour limit');
                      }
                      setRotaDays(outcome.updatedDays);
                    }}
                  >Assign</button>
                </div>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}
