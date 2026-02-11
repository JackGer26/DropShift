import React, { useState } from 'react';
import { DayTemplate, ShiftTemplate } from '../../types/template';
import { Role } from '../../types/staff';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function createEmptyDay(dayOfWeek: number): DayTemplate {
  return {
    dayOfWeek,
    shifts: [],
  };
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

interface TemplateBuilderProps {
  days: DayTemplate[];
  setDays: React.Dispatch<React.SetStateAction<DayTemplate[]>>;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ days, setDays }) => {
  const [activeDay, setActiveDay] = useState<number>(0);

  // Form state for new shift
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [roleRequired, setRoleRequired] = useState<Role>(Role.Manager);
  const [quantityRequired, setQuantityRequired] = useState(1);

  function handleAddShift(e: React.FormEvent) {
    e.preventDefault();
    const newShift: ShiftTemplate = {
      id: generateId(),
      startTime,
      endTime,
      roleRequired,
      quantityRequired,
    };
    setDays(prev =>
      prev.map(day =>
        day.dayOfWeek === activeDay
          ? { ...day, shifts: [...day.shifts, newShift] }
          : day
      )
    );
    setStartTime('');
    setEndTime('');
    setRoleRequired(Role.Manager);
    setQuantityRequired(1);
  }

  function handleDeleteShift(shiftId: string) {
    setDays(prev =>
      prev.map(day =>
        day.dayOfWeek === activeDay
          ? { ...day, shifts: day.shifts.filter(s => s.id !== shiftId) }
          : day
      )
    );
  }

  return (
    <div>
      <div>
        {dayNames.map((name, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveDay(idx)}
            disabled={activeDay === idx}
          >
            {name}
          </button>
        ))}
      </div>
      <h3>Shifts for {dayNames[activeDay]}</h3>
      <ul>
        {days[activeDay].shifts.map(shift => (
          <li key={shift.id}>
            {shift.startTime} - {shift.endTime} | {shift.roleRequired} | {shift.quantityRequired} staff
            <button type="button" onClick={() => handleDeleteShift(shift.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleAddShift}>
        <input
          type="time"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
        />
        <input
          type="time"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          required
        />
        <select value={roleRequired} onChange={e => setRoleRequired(e.target.value as Role)}>
          <option value={Role.Manager}>Manager</option>
          <option value={Role.AssistantManager}>Assistant Manager</option>
          <option value={Role.SalesAssistant}>Sales Assistant</option>
        </select>
        <input
          type="number"
          min={1}
          value={quantityRequired}
          onChange={e => setQuantityRequired(Number(e.target.value))}
          required
        />
        <button type="submit">Add Shift</button>
      </form>
    </div>
  );
};
