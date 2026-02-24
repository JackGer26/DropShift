import React, { useEffect, useState, useRef } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchStaff } from '@/services/staff.service';
import { fetchTemplates } from '@/services/template.service';
import { Staff } from '@/types/staff';
import { RotaTemplate } from '@/types/template';
import { RotaDay, Rota } from '@/types/rota';
import { StaffCard } from './components/StaffCard';
import { DayColumn } from './components/DayColumn';
import { createRota as createRotaApi, updateRota as updateRotaApi, fetchRotas, copyPreviousWeekRota, deleteRota as deleteRotaApi } from '@/services/rota.service';
import { validateAssignment, calculateWarnings, applyAssignment, calculateWeeklyHours, getSuggestedStaff, MAX_WEEKLY_HOURS, calculateShiftDuration } from '@/domain/scheduling';
import type { DomainStaff } from '@/domain/scheduling';
import { getStartOfWeek, getNextWeek, getPreviousWeek } from '@/utils/weekUtils';
import { formatWeekDateLong } from '@/utils/rotaUtils';
import { Card, PageContainer, Button, Modal } from '@/ui';

type Toast = { id: number; type: 'success' | 'error' | 'warning'; message: string };
type ConfirmState = { title: string; message: string; isDangerous: boolean; onConfirm: () => void | Promise<void> } | null;

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
  const [draftName, setDraftName] = useState<string>('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const toastIdRef = useRef(0);

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
    setDraftName(rota.name ?? '');
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
        shifts: (templateDay.shifts || []).map((shift, shiftIdx) => {
          const shiftId = (shift as any)._id?.toString() || shift.id || `${rota.templateId}-d${templateDay.dayOfWeek}-s${shiftIdx}`;
          const assignedStaffIds = assignments
            .filter((a: any) => String(a.shiftTemplateId) === shiftId)
            .map((a: any) => String(a.staffId));
          return {
            ...shift,
            id: shiftId,
            shiftTemplateId: shiftId,
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
        shifts: (day.shifts || []).map((shift, shiftIdx) => {
          const shiftId = (shift as any)._id?.toString() || shift.id || `${found._id}-d${day.dayOfWeek}-s${shiftIdx}`;
          return { ...shift, id: shiftId, shiftTemplateId: shiftId, assignedStaffIds: [] };
        }),
      }));
      setRotaDays(rotaDays);
      setDraftName('');
    } else if (!found) {
      setRotaDays([]);
      setDraftName('');
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
          setTimeout(() => addToast('warning', 'Staff member is already assigned to an overlapping shift.'), 0);
        }
        return prevDays;
      }

      // 2. Soft constraints
      const hoursMap = calculateWeeklyHours(prevDays);
      const warnings = calculateWarnings(shift, hoursMap.get(domainStaff.id) ?? 0);
      if (warnings.includes('EXCEEDS_WEEKLY_HOURS')) {
        setTimeout(() => addToast('warning', 'This assignment exceeds the weekly hour limit.'), 0);
      }

      // Contracted-hours warning (personalised per staff member)
      const staffRecord = staff.find(s => s._id === staffData._id);
      if (staffRecord?.contractedHours !== undefined && shift.startTime && shift.endTime) {
        const currentHours = hoursMap.get(domainStaff.id) ?? 0;
        const projected = currentHours + calculateShiftDuration(shift.startTime, shift.endTime);
        if (projected > staffRecord.contractedHours) {
          setTimeout(() => addToast('warning',
            `${staffData.name} will exceed their contracted ${staffRecord.contractedHours}h ` +
            `(${projected.toFixed(1)}h after this shift).`
          ), 0);
        }
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

  function addToast(type: Toast['type'], message: string) {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }

  function showConfirm(title: string, message: string, onConfirm: () => void | Promise<void>, isDangerous = false) {
    setConfirmState({ title, message, isDangerous, onConfirm });
  }

  function handleRemoveStaff(shiftTemplateId: string, staffId: string, dayOfWeek: number) {
    setRotaDays(prevDays =>
      prevDays.map(day => {
        if (day.dayOfWeek !== dayOfWeek) return day;
        return {
          ...day,
          shifts: day.shifts.map(shift => {
            if (((shift as any).shiftTemplateId || shift.id) !== shiftTemplateId) return shift;
            return {
              ...shift,
              assignedStaffIds: (shift.assignedStaffIds ?? []).filter(id => id !== staffId),
            };
          }),
        };
      })
    );
  }

  type SaveRotaParams = {
    locationId: string;
    templateId: string;
    rotaDays: RotaDay[];
  };

  async function saveRota({ locationId, templateId, rotaDays }: SaveRotaParams): Promise<void> {
    if (!draftName.trim()) {
      addToast('warning', 'Please enter a name for the draft rota before saving.');
      return;
    }

    const trimmedName = draftName.trim().toLowerCase();
    const duplicate = rotas.find(r => {
      const rotaId = r.id || (r as any)._id;
      return (
        r.weekStartDate === weekStartDate &&
        r.name?.trim().toLowerCase() === trimmedName &&
        String(rotaId) !== String(selectedRotaId)
      );
    });
    if (duplicate) {
      addToast('error', `A rota named "${draftName.trim()}" already exists for this week. Please choose a different name.`);
      return;
    }

    if (!locationId || !templateId || !rotaDays) {
      addToast('error', 'Missing required parameters for saving rota.');
      return;
    }

    const isValidObjectId = (id: string) => /^[a-f\d]{24}$/i.test(id);

    if (!isValidObjectId(locationId) || !isValidObjectId(templateId)) {
      addToast('error', 'Invalid locationId or templateId. Please check your template data.');
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
      addToast('warning', 'Some assignments had invalid IDs and will not be saved.');
    }

    const payload = {
      name: draftName.trim() || undefined,
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
      addToast('success', 'Draft rota saved.');
    } catch (error) {
      console.error('Failed to save rota:', error);
      addToast('error', 'Failed to save rota. See console for details.');
    }
  }

  async function publishRota() {
    if (!selectedRotaId) {
      addToast('warning', 'No rota selected to publish.');
      return;
    }
    try {
      const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (!rota) { addToast('error', 'Selected rota not found.'); return; }
      const payload = { ...rota, status: 'published' as 'published' };
      await updateRotaApi(selectedRotaId, payload);
      const rotasData = await fetchRotas();
      setRotas(rotasData);
      const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
      if (updatedRota) await loadRotaFromObject(updatedRota);
      addToast('success', 'Rota published successfully.');
    } catch (error) {
      console.error('Failed to publish rota:', error);
      addToast('error', 'Failed to publish rota. See console for details.');
    }
  }

  function handleCopyPreviousWeek() {
    if (!selectedTemplate || !selectedTemplateId) {
      addToast('warning', 'Please select a template first.');
      return;
    }
    const locationId = selectedTemplate.locationId;
    if (!locationId || locationId.length !== 24) {
      addToast('warning', 'Selected template is missing a valid locationId.');
      return;
    }
    const existingRota = rotas.find(r => r.weekStartDate === weekStartDate);
    if (existingRota) {
      addToast('warning', `A rota already exists for this week (${weekStartDate}).`);
      return;
    }
    showConfirm(
      'Copy Previous Week',
      `Copy the previous week's rota to ${weekStartDate}?`,
      async () => {
        try {
          const response = await copyPreviousWeekRota(locationId, weekStartDate);
          const rotasData = await fetchRotas(weekStartDate);
          setRotas(rotasData);
          if (response.rota) await loadRotaFromObject(response.rota);
          addToast('success', `Copied from ${response.copiedFrom.weekStartDate}.`);
        } catch (error: any) {
          console.error('Failed to copy previous week:', error);
          if (error.response?.status === 404) {
            addToast('error', 'No rota found for the previous week.');
          } else if (error.response?.status === 409) {
            addToast('error', 'A rota already exists for this week.');
          } else {
            addToast('error', `Failed to copy: ${error.response?.data?.message || error.message}`);
          }
        }
      }
    );
  }

  function handleDeleteRota(rotaId: string, status: 'draft' | 'published') {
    const message = status === 'published'
      ? 'Deleting a published rota cannot be undone and will remove it from staff schedules.'
      : 'This will permanently delete the draft rota.';
    showConfirm(
      `Delete ${status === 'published' ? 'Published' : 'Draft'} Rota`,
      message,
      async () => {
        try {
          await deleteRotaApi(rotaId);
          const rotasData = await fetchRotas(weekStartDate);
          setRotas(rotasData);
          if (selectedRotaId === rotaId) {
            setSelectedRotaId(null);
            setRotaDays([]);
          }
          addToast('success', `${status === 'published' ? 'Published' : 'Draft'} rota deleted.`);
        } catch (error: any) {
          console.error('Failed to delete rota:', error);
          addToast('error', `Failed to delete: ${error.response?.data?.message || error.message}`);
        }
      },
      true // isDangerous
    );
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

  // Suggestion data — derived from selectedShift, used in the staff pool panel
  const suggestionData = (() => {
    if (!selectedShift) return null;
    const { shiftTemplateId, dayOfWeek } = selectedShift;
    const day = rotaDays.find(d => d.dayOfWeek === dayOfWeek);
    if (!day) return null;
    const shift = day.shifts.find(s => (s.shiftTemplateId || s.id) === shiftTemplateId);
    if (!shift) return null;
    const domainStaffList: DomainStaff[] = staff.map(s => ({ id: s._id, name: s.name, role: s.role, contractedHours: s.contractedHours }));
    const suggestions = getSuggestedStaff(shift, dayOfWeek, rotaDays, domainStaffList);
    const hoursMap = calculateWeeklyHours(rotaDays);
    return { shift, day, shiftTemplateId, suggestions, hoursMap };
  })();

  // Staff pool sidebar — draggable prop toggled by isDraftEditable
  const staffPanel = (
    <Card title="Staff Pool" className="w-56 shrink-0">
      {suggestionData && suggestionData.suggestions.length > 0 && (
        <div className="mb-3 rounded-md bg-indigo-50 border border-indigo-200 p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Suggested</span>
            <button
              onClick={() => setSelectedShift(null)}
              className="text-gray-400 hover:text-gray-600 text-sm leading-none"
              aria-label="Clear selection"
            >✕</button>
          </div>
          <div className="space-y-1.5">
            {suggestionData.suggestions.map(s => {
              const { shift, day, shiftTemplateId, hoursMap } = suggestionData;
              const hours = hoursMap.get(s.id) ?? 0;
              const isOver = hours >= MAX_WEEKLY_HOURS;
              const isNear = hours >= 0.9 * MAX_WEEKLY_HOURS;
              return (
                <div key={s.id} className="flex items-center justify-between gap-2 px-2 py-1.5 bg-white border border-indigo-100 rounded">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{s.name}</div>
                    <span className={`text-xs tabular-nums ${isOver ? 'text-red-600' : isNear ? 'text-amber-600' : 'text-gray-400'}`}>
                      {hours}h{isOver ? ' · over limit' : isNear ? ' · near limit' : ''}
                    </span>
                  </div>
                  <button
                    className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors"
                    onClick={() => {
                      const validation = validateAssignment(s, shift, day);
                      if (!validation.valid) return;
                      const shiftWarnings = calculateWarnings(shift, hoursMap.get(s.id) ?? 0);
                      if (shiftWarnings.includes('EXCEEDS_WEEKLY_HOURS')) {
                        addToast('warning', 'This assignment exceeds the weekly hour limit.');
                      }
                      // Contracted-hours warning
                      const staffRecord = staff.find(m => m._id === s.id);
                      if (staffRecord?.contractedHours !== undefined && shift.startTime && shift.endTime) {
                        const currentHours = hoursMap.get(s.id) ?? 0;
                        const projected = currentHours + calculateShiftDuration(shift.startTime, shift.endTime);
                        if (projected > staffRecord.contractedHours) {
                          addToast('warning',
                            `${s.name} will exceed their contracted ${staffRecord.contractedHours}h ` +
                            `(${projected.toFixed(1)}h after this shift).`
                          );
                        }
                      }
                      const outcome = applyAssignment(s.id, shiftTemplateId, rotaDays);
                      if (!outcome.success) return;
                      setRotaDays(outcome.updatedDays as RotaDay[]);
                    }}
                    title={`Assign ${s.name}`}
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 pt-2 border-t border-indigo-100">
            <span className="text-xs font-medium text-gray-500">All Staff</span>
          </div>
        </div>
      )}
      {staff.length === 0 ? (
        <p className="text-xs text-gray-400 text-center">No staff found.</p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto">
          {staff.map(s => (
            <StaffCard key={s._id} staff={s} draggable={isDraftEditable} />
          ))}
        </div>
      )}
    </Card>
  );

  // Rota grid — shared between draft and published modes
  const rotaGrid = (
    <Card bodyClassName={rotaDays.length > 0 ? 'p-4 overflow-x-auto' : 'flex items-center justify-center h-32'}>
      {rotaDays.length > 0 ? (
        <div
          style={{ display: 'grid', gridTemplateColumns: `repeat(${rotaDays.length}, minmax(140px, 1fr))`, gap: '8px' }}
        >
          {rotaDays.map(day => (
            <DayColumn
              key={day.dayOfWeek}
              day={day}
              staff={staff}
              weeklyHours={weeklyHours}
              onSelectShift={isDraftEditable ? handleSelectShift : undefined}
              onRemoveStaff={isDraftEditable ? handleRemoveStaff : undefined}
            />
          ))}
        </div>
      ) : (
        <span className="text-sm text-gray-400">Select a template to view the rota grid.</span>
      )}
    </Card>
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
      <Card className="mb-5" bodyClassName="flex flex-wrap items-end gap-5 p-4">

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
              <Button variant="danger" onClick={() => handleDeleteRota(selectedRotaId!, 'published')}>
                Delete
              </Button>
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
              <Button variant="danger" onClick={() => handleDeleteRota(selectedRotaId!, 'draft')}>
                Delete
              </Button>
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

        {/* Draft name */}
        {isDraftEditable && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500">Draft Name</label>
            <input
              type="text"
              className={`${selectClass} ${!draftName.trim() ? 'border-red-300 focus:ring-red-400' : ''}`}
              placeholder="e.g. Week A (required)"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              maxLength={60}
            />
          </div>
        )}

        {/* Action buttons — flush right */}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            disabled={!!isEditingDisabled}
            onClick={() => {
              if (!selectedTemplateId || !selectedTemplate) {
                addToast('warning', 'Please select a template first.');
                return;
              }
              if (!selectedTemplate.locationId || selectedTemplate.locationId.length !== 24) {
                addToast('error', 'Template is missing a valid locationId.');
                return;
              }
              saveRota({ locationId: selectedTemplate.locationId, templateId: selectedTemplateId, rotaDays });
            }}
          >
            Save Draft
          </Button>

          {!isPublishedThisWeek && (
            <Button
              variant="secondary"
              disabled={!selectedTemplate}
              title={!selectedTemplate ? 'Select a template first' : 'Copy assignments from previous week'}
              onClick={handleCopyPreviousWeek}
            >
              Copy Previous Week
            </Button>
          )}

          <Button
            variant="success"
            disabled={rotaStatus === 'published'}
            title={rotaStatus === 'published' ? 'This rota is already published' : 'Publish this rota'}
            onClick={async () => {
              if (!selectedRotaId) { addToast('warning', 'No rota selected to publish.'); return; }
              try {
                const rota = rotas.find(r => (r.id || (r as any)._id) === selectedRotaId);
                if (!rota) { addToast('error', 'Selected rota not found.'); return; }
                const payload = { ...rota, status: 'published' as 'published', weekStartDate };
                await updateRotaApi(selectedRotaId, payload);
                const rotasData = await fetchRotas(weekStartDate);
                setRotas(rotasData);
                const updatedRota = rotasData.find(r => (r.id || (r as any)._id) === selectedRotaId);
                if (updatedRota) await loadRotaFromObject(updatedRota);
                addToast('success', 'Rota published successfully.');
              } catch (error) {
                console.error('Failed to publish rota:', error);
                addToast('error', 'Failed to publish rota. See console for details.');
              }
            }}
          >
            Publish
          </Button>
        </div>
      </Card>

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

      {/* ── Toast notifications ── */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm max-w-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span className="shrink-0 font-bold">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : '⚠'}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity leading-none ml-1"
            >×</button>
          </div>
        ))}
      </div>

      {/* ── Confirm modal ── */}
      <Modal
        isOpen={confirmState !== null}
        title={confirmState?.title ?? ''}
        message={confirmState?.message ?? ''}
        isDangerous={confirmState?.isDangerous ?? false}
        onConfirm={async () => {
          const fn = confirmState?.onConfirm;
          setConfirmState(null);
          if (fn) await fn();
        }}
        onCancel={() => setConfirmState(null)}
      />
    </PageContainer>
  );
}
