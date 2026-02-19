import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchStaff } from '@/services/staff.service';
import { fetchTemplates } from '@/services/template.service';
import { Staff } from '@/types/staff';
import { RotaTemplate } from '@/types/template';
import { RotaDay, Rota } from '@/types/rota';
import { StaffCard } from './components/StaffCard';
import { DayColumn } from './components/DayColumn';
import { createRota as createRotaApi, updateRota as updateRotaApi, fetchRotas, copyPreviousWeekRota, deleteRota as deleteRotaApi } from '@/services/rota.service';
import { validateAssignment, calculateWarnings, applyAssignment, calculateWeeklyHours, getSuggestedStaff, MAX_WEEKLY_HOURS } from '@/domain/scheduling';
import type { DomainStaff } from '@/domain/scheduling';
import { getStartOfWeek, getNextWeek, getPreviousWeek } from '@/utils/weekUtils';
import { formatWeekDateLong } from '@/utils/rotaUtils';
import { PageContainer } from '@/ui';

export function RotaBuilderPage() {
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

  // Fetch data (staff, templates, rotas) on mount and when weekStartDate changes
  useEffect(() => {
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
    if (!rota || !rota.templateId) return;
    setSelectedRotaId(rota.id || (rota as any)._id || null);
    setSelectedTemplateId(rota.templateId);
    const template = templates.find(t => String(t._id) === String(rota.templateId)) || null;
    if (!template) {
      setTempError(`⚠️ Template not found for this rota. The template (${rota.templateId}) may have been deleted. Please use the Delete button to remove this rota.`);
      console.error('Template not found. Looking for:', rota.templateId, 'Available templates:', templates.map(t => t._id));
      setRotaDays([]);
      return;
    }
    const assignmentsByDay = new Map();
    for (const day of (rota.days || [])) {
      assignmentsByDay.set(day.dayOfWeek, Array.isArray((day as any).assignments) ? (day as any).assignments : []);
    }
    const rotaDays: RotaDay[] = template.days.map(templateDay => {
      const assignments = assignmentsByDay.get(templateDay.dayOfWeek) || [];
      return {
        dayOfWeek: templateDay.dayOfWeek,
        shifts: (templateDay.shifts || []).map(shift => {
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
    if (found && !selectedRotaId) {
      const rotaDays = found.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        shifts: (day.shifts || []).map(shift => ({
          ...shift,
          id: shift.id,
          shiftTemplateId: shift.id,
          assignedStaffIds: [],
        })),
      }));
      setRotaDays(rotaDays);
    } else if (!found) {
      setRotaDays([]);
    }
  }, [selectedTemplateId, templates, selectedRotaId]);

  function handleDragEnd(event: DragEndEvent) {
    // --- Domain layer: explicit three-step assignment flow ---
    //
    //   1. validateAssignment(staff, shift, day)   – hard constraints
    //   2. calculateWarnings(shift, currentHours)   – soft constraints
    //   3. applyAssignment(staffId, shiftTemplateId, allDays) – state transition
    //
    setActiveId(null);
    const staffData = (event.active.data?.current as { staff?: Staff })?.staff;
    const shiftTemplateId = event.over?.id as string | undefined;
    if (!staffData || !shiftTemplateId) return;

    setRotaDays(prevDays => {
      const domainStaff: DomainStaff = { id: staffData._id, name: staffData.name, role: staffData.role };

      const day = prevDays.find(d => d.shifts.some(s => s.shiftTemplateId === shiftTemplateId));
      const shift = day?.shifts.find(s => s.shiftTemplateId === shiftTemplateId);
      if (!day || !shift) return prevDays;

      // 1. Hard constraints
      const validation = validateAssignment(domainStaff, shift, day);
      if (!validation.valid) {
        if (validation.rejection === 'OVERLAPPING_SHIFT') {
          setTimeout(() => {
            setTempError('Staff member is already assigned to overlapping shift');
            setTimeout(() => setTempError(null), 2500);
          }, 0);
        }
        return prevDays;
      }

      // 2. Soft constraints
      const hoursMap = calculateWeeklyHours(prevDays);
      const warnings = calculateWarnings(shift, hoursMap.get(domainStaff.id) ?? 0);
      if (warnings.includes('EXCEEDS_WEEKLY_HOURS')) {
        setTimeout(() => alert('Warning: exceeds weekly hour limit'), 0);
      }

      // 3. State transition
      const outcome = applyAssignment(domainStaff.id, shiftTemplateId, prevDays);
      if (!outcome.success) return prevDays;

      return outcome.updatedDays as RotaDay[];
    });
  }

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  // Adapter: DayColumn fires (shiftTemplateId, dayOfWeek) separately; state wants an object
  function handleSelectShift(shiftTemplateId: string, dayOfWeek: number) {
    setSelectedShift({ shiftTemplateId, dayOfWeek });
  }

  type SaveRotaParams = {
    locationId: string;
    templateId: string;
    rotaDays: RotaDay[];
  };

  async function saveRota({ locationId, templateId, rotaDays }: SaveRotaParams): Promise<void> {
    if (!locationId || !templateId || !rotaDays) {
      alert('Missing required parameters for saving rota');
      return;
    }

    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

    if (!isValidObjectId(locationId) || !isValidObjectId(templateId)) {
      alert('Invalid locationId or templateId. Please check your template data.');
      return;
    }

    const template = templates.find(t => t._id === templateId);
    let foundInvalid = false;
    const days = (template ? template.days : rotaDays).map(templateDay => {
      const rotaDay = rotaDays.find(rd => rd.dayOfWeek === templateDay.dayOfWeek);
      const assignments: { staffId: string, shiftTemplateId: string }[] = [];
      if (rotaDay) {
        for (const shift of rotaDay.shifts) {
          for (const staffId of shift.assignedStaffIds || []) {
            if (isValidObjectId(staffId) && isValidObjectId(shift.shiftTemplateId)) {
              assignments.push({ staffId: String(staffId), shiftTemplateId: String(shift.shiftTemplateId) });
            } else {
              foundInvalid = true;
            }
          }
        }
      }
      return { dayOfWeek: templateDay.dayOfWeek, assignments };
    });
    if (foundInvalid) {
      alert('Some staff or shift IDs are not valid ObjectIds. Assignments with invalid IDs will not be saved.');
    }

    const payload = {
      locationId: String(locationId),
      templateId: String(templateId),
      weekStartDate,
      status: 'draft' as 'draft',
      days,
    };

    try {
      let response;
      let rotaId: string;
      if (selectedRotaId) {
        response = await updateRotaApi(selectedRotaId, payload as any);
        rotaId = response.id || (response as any)._id;
      } else {
        response = await createRotaApi(payload as any);
        rotaId = response.id || (response as any)._id;
      }
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);
      setSelectedRotaId(rotaId);
      const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === rotaId);
      if (updatedRota) await loadRotaFromObject(updatedRota);
      alert('Draft rota saved.');
    } catch (error) {
      console.error('Failed to save rota:', error);
      alert('Failed to save rota. See console for details.');
    }
  }

  async function publishRota() {
    if (!selectedRotaId) {
      alert('No rota selected to publish.');
      return;
    }
    try {
      const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (!rota) { alert('Selected rota not found.'); return; }
      const payload = { ...rota, status: 'published' as 'published' };
      await updateRotaApi(selectedRotaId, payload);
      const rotasData = await fetchRotas();
      setRotas(rotasData);
      const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (updatedRota) await loadRotaFromObject(updatedRota);
      alert('Rota published successfully.');
    } catch (error) {
      console.error('Failed to publish rota:', error);
      alert('Failed to publish rota. See console for details.');
    }
  }

  async function handleCopyPreviousWeek() {
    try {
      if (!selectedTemplate || !selectedTemplateId) {
        alert('Please select a template first.');
        return;
      }
      const locationId = selectedTemplate.locationId;
      if (!locationId || locationId.length !== 24) {
        alert('Selected template is missing a valid locationId.');
        return;
      }
      const existingRota = rotas.find(r => r.weekStartDate === weekStartDate);
      if (existingRota) {
        alert(`A rota already exists for this week (${weekStartDate}). Please delete or select it instead.`);
        return;
      }
      if (!window.confirm(`Copy previous week's rota to ${weekStartDate}?`)) return;
      const response = await copyPreviousWeekRota(locationId, weekStartDate);
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);
      if (response.rota) await loadRotaFromObject(response.rota);
      alert(`Successfully copied rota from ${response.copiedFrom.weekStartDate}!`);
    } catch (error: any) {
      console.error('Failed to copy previous week:', error);
      if (error.response?.status === 404) {
        alert('No rota found for the previous week. Please create one manually.');
      } else if (error.response?.status === 409) {
        alert('A rota already exists for this week.');
      } else {
        alert(`Failed to copy previous week's rota: ${error.response?.data?.message || error.message}`);
      }
    }
  }

  async function handleDeleteRota(rotaId: string, status: 'draft' | 'published') {
    try {
      const confirmMessage = status === 'published'
        ? 'Are you sure you want to delete this PUBLISHED rota? This action cannot be undone and will affect staff schedules!'
        : 'Are you sure you want to delete this draft rota?';
      if (!window.confirm(confirmMessage)) return;
      await deleteRotaApi(rotaId);
      const rotasData = await fetchRotas(weekStartDate);
      setRotas(rotasData);
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

  // ─── Derived state ──────────────────────────────────────────────────────────

  const selectedRota = selectedRotaId
    ? rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId))
    : null;
  const isEditingDisabled = loading || !!error || (selectedRota && selectedRota.status === 'published');
  const rotaStatus = selectedRota?.status ?? 'draft';
  const isDraftEditable = rotaStatus === 'draft' && !isEditingDisabled;
  const isPublishedThisWeek = rotas.some(r => r.weekStartDate === weekStartDate && r.status === 'published');

  // ─── Early returns ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          Loading rota builder…
        </div>
      </PageContainer>
    );
  }
  if (error) {
    return (
      <PageContainer>
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      </PageContainer>
    );
  }
  if (!staff.length && !templates.length) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-32 text-sm text-gray-400">
          No staff or templates found.
        </div>
      </PageContainer>
    );
  }

  // ─── Shared sub-sections (avoid duplicating the JSX across draft/published) ─

  // Staff pool sidebar — draggable prop toggled by isDraftEditable
  const staffPanel = (
    <aside className="w-52 shrink-0 bg-white border border-gray-200 rounded-lg p-3 flex flex-col">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Staff Pool
      </h3>
      {staff.length === 0 ? (
        <p className="text-xs text-gray-400">No staff found.</p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto">
          {staff.map(s => (
            <StaffCard key={s._id} staff={s} draggable={isDraftEditable} />
          ))}
        </div>
      )}
    </aside>
  );

  // Rota grid — shared between draft and published modes
  const rotaGrid = rotaDays.length > 0 ? (
    <div
      className="overflow-x-auto"
    >
      <div
        style={{ display: 'grid', gridTemplateColumns: `repeat(${rotaDays.length}, minmax(140px, 1fr))`, gap: '8px' }}
      >
        {rotaDays.map(day => (
          <DayColumn
            key={day.dayOfWeek}
            day={day}
            staff={staff}
            onSelectShift={handleSelectShift}
          />
        ))}
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-center h-32 text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg">
      Select a template to view the rota grid.
    </div>
  );

  // Two-panel layout (staff pool + grid)
  const twoPanel = (
    <div className="flex gap-4 min-h-0">
      {staffPanel}
      <div className="flex-1 min-w-0">{rotaGrid}</div>
    </div>
  );

  // ─── Reusable select + label group ─────────────────────────────────────────

  const selectClass =
    'text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      {/* Error banner */}
      {tempError && (
        <div className="mb-4 flex items-start gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <span className="shrink-0">⚠</span>
          <span>{tempError}</span>
        </div>
      )}

      {/* ── Top bar: week navigation + status badge ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStartDate(getPreviousWeek(weekStartDate))}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            aria-label="Previous week"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[14rem] text-center">
            {formatWeekDateLong(weekStartDate)}
          </span>
          <button
            onClick={() => setWeekStartDate(getNextWeek(weekStartDate))}
            className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
            aria-label="Next week"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
          rotaStatus === 'published'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          {rotaStatus === 'published' ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* ── Controls bar: dropdowns + action buttons ── */}
      <div className="flex flex-wrap items-end gap-5 p-4 bg-white border border-gray-200 rounded-lg mb-5">

        {/* Published rotas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Published Rota</label>
          <div className="flex items-center gap-2">
            <select
              className={selectClass}
              value={
                selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'published')
                  ? selectedRotaId
                  : ''
              }
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
                    : rotaId;
                  return <option key={rotaId} value={rotaId}>{rotaLabel}</option>;
                })}
            </select>
            {selectedRota?.status === 'published' && (
              <button
                onClick={() => handleDeleteRota(selectedRotaId!, 'published')}
                className="text-sm px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Draft rotas */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Draft Rota</label>
          <div className="flex items-center gap-2">
            <select
              className={selectClass}
              value={
                selectedRotaId && rotas.find(r => String(r.id || (r as any)._id) === String(selectedRotaId) && r.status === 'draft')
                  ? selectedRotaId
                  : ''
              }
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
                    : rotaId;
                  return <option key={rotaId} value={rotaId}>{rotaLabel}</option>;
                })}
            </select>
            {selectedRota?.status === 'draft' && (
              <button
                onClick={() => handleDeleteRota(selectedRotaId!, 'draft')}
                className="text-sm px-2.5 py-1.5 rounded-md border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Template */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">Template</label>
          <select
            className={selectClass}
            value={selectedTemplateId || ''}
            onChange={e => {
              setSelectedTemplateId(e.target.value);
              setSelectedRotaId(null);
            }}
          >
            <option value="">Select template</option>
            {templates.map(t => (
              <option key={t._id} value={t._id}>{t.name || t._id}</option>
            ))}
          </select>
        </div>

        {/* Action buttons — flush right */}
        <div className="ml-auto flex items-center gap-2">
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
            className="text-sm px-3 py-1.5 rounded-md bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Draft
          </button>

          {!isPublishedThisWeek && (
            <button
              onClick={handleCopyPreviousWeek}
              disabled={!selectedTemplate}
              title={!selectedTemplate ? 'Select a template first' : 'Copy assignments from previous week'}
              className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Copy Previous Week
            </button>
          )}

          <button
            onClick={async () => {
              if (!selectedRotaId) { alert('No rota selected to publish.'); return; }
              try {
                const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
                if (!rota) { alert('Selected rota not found.'); return; }
                const payload = { ...rota, status: 'published' as 'published', weekStartDate };
                await updateRotaApi(selectedRotaId, payload);
                const rotasData = await fetchRotas(weekStartDate);
                setRotas(rotasData);
                const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
                if (updatedRota) await loadRotaFromObject(updatedRota);
                alert('Rota published successfully.');
              } catch (error) {
                console.error('Failed to publish rota:', error);
                alert('Failed to publish rota. See console for details.');
              }
            }}
            disabled={rotaStatus === 'published'}
            title={rotaStatus === 'published' ? 'This rota is already published' : 'Publish this rota'}
            className="text-sm px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Publish
          </button>
        </div>
      </div>

      {/* ── Main layout: staff pool + rota grid ── */}
      {/* Conditionally wrap in DndContext for drag-and-drop in draft mode */}
      {isDraftEditable ? (
        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          {twoPanel}
          <DragOverlay>
            {activeId ? (() => {
              const draggedStaff = staff.find(s => (s.id || s._id) === activeId);
              return draggedStaff ? <StaffCard staff={draggedStaff} /> : null;
            })() : null}
          </DragOverlay>
        </DndContext>
      ) : twoPanel}

      {/* ── Suggestion panel ── */}
      {selectedShift && (() => {
        const { shiftTemplateId, dayOfWeek } = selectedShift;
        const day = rotaDays.find(d => d.dayOfWeek === dayOfWeek);
        if (!day) return null;
        const shift = day.shifts.find(s => (s.shiftTemplateId || s.id) === shiftTemplateId);
        if (!shift) return null;
        const domainStaffList: DomainStaff[] = staff.map(s => ({ id: s._id, name: s.name, role: s.role }));
        const suggestions = getSuggestedStaff(shift, dayOfWeek, rotaDays, domainStaffList);
        const hoursMap = calculateWeeklyHours(rotaDays);
        if (!suggestions.length) return null;

        return (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Suggested Staff
            </h3>
            <div className="space-y-2">
              {suggestions.map(s => {
                const hours = hoursMap.get(s.id) ?? 0;
                const isOver   = hours >= MAX_WEEKLY_HOURS;
                const isNear   = hours >= 0.9 * MAX_WEEKLY_HOURS;
                return (
                  <div key={s.id} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-800 font-medium truncate">{s.name}</span>
                      <span className={`text-xs tabular-nums font-medium ${
                        isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {hours}h
                      </span>
                      {isOver && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                          Over limit
                        </span>
                      )}
                      {!isOver && isNear && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                          Near limit
                        </span>
                      )}
                    </div>
                    <button
                      className="shrink-0 text-xs px-2.5 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        const validation = validateAssignment(s, shift, day);
                        if (!validation.valid) return;
                        const shiftWarnings = calculateWarnings(shift, hoursMap.get(s.id) ?? 0);
                        if (shiftWarnings.includes('EXCEEDS_WEEKLY_HOURS')) {
                          alert('Warning: exceeds weekly hour limit');
                        }
                        const outcome = applyAssignment(s.id, shiftTemplateId, rotaDays);
                        if (!outcome.success) return;
                        setRotaDays(outcome.updatedDays as RotaDay[]);
                      }}
                    >
                      Assign
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </PageContainer>
  );
}
