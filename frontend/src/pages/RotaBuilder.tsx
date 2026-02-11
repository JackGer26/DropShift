import React, { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { fetchStaff } from '../services/staff.service';
import { fetchTemplates } from '../services/template.service';
import { Staff } from '../types/staff';
import { RotaTemplate } from '../types/template';
import { StaffCard } from '../components/rota/StaffCard';
import { ShiftSlot } from '../components/rota/ShiftSlot';

export function RotaBuilder() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [templates, setTemplates] = useState<RotaTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<RotaTemplate | null>(null);
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
  }, [selectedTemplateId, templates]);

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    console.log('DragEnd:', {
      active: event.active,
      over: event.over,
    });
    if (event.over) {
      alert(`Dropped staff ${event.active.id} onto shift ${event.over.id}`);
    }
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

          {selectedTemplate ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {selectedTemplate.days.map(day => (
                <div key={day.dayOfWeek} style={{ border: '1px solid #ccc', padding: 8 }}>
                  <h4>Day {day.dayOfWeek}</h4>
                  {day.shifts.length === 0 ? (
                    <div>No shifts.</div>
                  ) : (
                    day.shifts.map(shift => (
                      <ShiftSlot key={shift.id} shift={shift} assignedStaff={[]} />
                    ))
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
