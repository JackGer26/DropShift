import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchStaff } from '../services/staff.service';
import { fetchTemplates } from '../services/template.service';
import { Staff } from '../types/staff';
import { RotaTemplate } from '../types/template';
import { RotaDay } from '../types/rota';
import { StaffCard } from '../components/rota/StaffCard';
import ShiftSlot from '../components/rota/ShiftSlot';

export function RotaBuilder() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<RotaTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<RotaTemplate | null>(null);
  const [rotaDays, setRotaDays] = useState<RotaDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    function ensureShiftIds(template: RotaTemplate): RotaTemplate {
      return {
        ...template,
        days: template.days.map(day => ({
          ...day,
          shifts: day.shifts.map(shift => ({
            ...shift,
            id: shift.id || Math.random().toString(36).substr(2, 9),
          })),
        })),
      };
    }

    async function loadData() {
      try {
        setLoading(true);
        const [staffData, templateData] = await Promise.all([
          fetchStaff(),
          fetchTemplates(),
        ]);
        setStaff(staffData);
        setTemplates(templateData.map(ensureShiftIds));
        setError(null);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const found = templates.find(t => t._id === selectedTemplateId);
    setSelectedTemplate(found || null);
    if (found) {
      // Convert template.days to RotaDay[] with RotaShift[] (ensure assignedStaffIds exists and shiftTemplateId is present)
      const rotaDays = found.days.map(day => ({
        dayOfWeek: day.dayOfWeek,
        shifts: (day.shifts || []).map(shift => ({
          ...shift,
          shiftTemplateId: shift.id, // use shift.id as shiftTemplateId
          assignedStaffIds: [],
        })),
      }));
      setRotaDays(rotaDays);
    } else {
      setRotaDays([]);
    }
  }, [selectedTemplateId, templates]);

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    // Assignment logic
    const staffData = (event.active.data?.current as { staff?: Staff })?.staff;
    const shiftTemplateId = event.over?.id as string | undefined;
    if (!staffData || !shiftTemplateId) return;

    setRotaDays(prevDays => {
      // Find the day and shift
      for (let dayIdx = 0; dayIdx < prevDays.length; dayIdx++) {
        const day = prevDays[dayIdx];
        if (!Array.isArray(day.shifts)) continue;
        const shiftIdx = day.shifts.findIndex(shift => shift.shiftTemplateId === shiftTemplateId);
        if (shiftIdx !== -1) {
          const shift = day.shifts[shiftIdx];
          // Prevent duplicate assignment of staff to any shift on this day
          const alreadyAssigned = day.shifts.some(s => s.assignedStaffIds.includes(staffData._id));
          const roleMismatch = staffData.role !== shift.roleRequired;
          const slotFull = shift.assignedStaffIds.length >= shift.quantityRequired;
          const alreadyInThisShift = shift.assignedStaffIds.includes(staffData._id);
          if (!roleMismatch && !slotFull && !alreadyInThisShift && !alreadyAssigned) {
            // Assign staff immutably (always use _id)
            const updatedShift = {
              ...shift,
              assignedStaffIds: [...shift.assignedStaffIds, staffData._id],
            };
            const updatedShifts = [
              ...day.shifts.slice(0, shiftIdx),
              updatedShift,
              ...day.shifts.slice(shiftIdx + 1),
            ];
            const updatedDay = { ...day, shifts: updatedShifts };
            return [
              ...prevDays.slice(0, dayIdx),
              updatedDay,
              ...prevDays.slice(dayIdx + 1),
            ];
          } else {
            if (roleMismatch) {
              console.warn(`Assignment rejected: Staff role (${staffData.role}) does not match required (${shift.roleRequired})`);
            } else if (slotFull) {
              console.warn('Assignment rejected: Shift is already full');
            } else if (alreadyInThisShift) {
              console.warn('Assignment rejected: Staff already assigned to this shift');
            } else if (alreadyAssigned) {
              console.warn('Assignment rejected: Staff already assigned to another shift on this day');
            }
            // If invalid, do nothing
            return prevDays;
          }
        }
      }
      return prevDays;
    });
  }

  function handleDragStart(event: any) {
    setActiveId(event.active.id);
  }

  if (loading) {
    return <div>Loading rota builder...</div>;
  }
  if (error) {
    return <div>{error}</div>;
  }
  if (!staff.length && !templates.length) {
    return <div>No staff or templates found.</div>;
  }

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
      <div style={{ display: 'flex', gap: 24 }}>
        {/* Left panel: StaffPool */}
        <div style={{ minWidth: 200 }}>
          <h3>Staff Pool</h3>
          {staff.length === 0 ? (
            <div>No staff found.</div>
          ) : (
            staff.map(s => (
              <StaffCard key={s._id} staff={s} />
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
          <h3>Rota Builder</h3>
          <label>
            Template:
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">Select template</option>
              {templates.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </label>

          {rotaDays.length > 0 ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {rotaDays.map(day => (
                <div key={day.dayOfWeek} style={{ border: '1px solid #ccc', padding: 8 }}>
                  <h4>Day {day.dayOfWeek}</h4>
                  {Array.isArray(day.shifts) && day.shifts.length > 0 ? (
                    day.shifts.map(shift => (
                      <ShiftSlot key={shift.id} shift={shift} staff={staff} />
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
  );
}
