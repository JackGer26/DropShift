import React, { useState } from 'react';
import { DayTemplate, ShiftTemplate } from '@/types/template';
import { Role } from '@/types/staff';
import { RoleBadge } from '@/ui';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

const inputClass =
  'text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

interface TimeSelectProps {
  label: string;
  value: string; // "HH:MM"
  onChange: (v: string) => void;
}

function TimeSelect({ label, value, onChange }: TimeSelectProps) {
  const [h = '09', m = '00'] = value.split(':');

  function update(newH: string, newM: string) {
    onChange(`${newH}:${newM}`);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <select
          className={inputClass}
          value={h}
          onChange={e => update(e.target.value, m)}
          aria-label={`${label} hour`}
        >
          {HOURS.map(hr => (
            <option key={hr} value={hr}>{hr}</option>
          ))}
        </select>
        <span className="text-gray-400 font-medium">:</span>
        <select
          className={inputClass}
          value={m}
          onChange={e => update(h, e.target.value)}
          aria-label={`${label} minute`}
        >
          {MINUTES.map(mn => (
            <option key={mn} value={mn}>{mn}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

interface TemplateBuilderProps {
  days: DayTemplate[];
  setDays: React.Dispatch<React.SetStateAction<DayTemplate[]>>;
  templateName: string;
}

export const TemplateBuilder: React.FC<TemplateBuilderProps> = ({ days, setDays, templateName }) => {
  const [activeDay, setActiveDay] = useState<number>(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
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

  const activeShifts = days[activeDay]?.shifts ?? [];

  return (
    <div className="space-y-4">
      {/* Template name header */}
      {templateName && (
        <div className="flex items-center gap-2 pb-1 border-b border-gray-200">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Template</span>
          <span className="text-sm font-semibold text-gray-900">{templateName}</span>
        </div>
      )}

      {/* Day tab bar */}
      <div className="flex flex-wrap gap-1.5">
        {DAY_NAMES.map((name, idx) => {
          const shiftCount = days[idx]?.shifts.length ?? 0;
          const isActive = activeDay === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveDay(idx)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {name}
              {shiftCount > 0 && (
                <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-semibold ${
                  isActive ? 'bg-white text-gray-900' : 'bg-gray-400 text-white'
                }`}>
                  {shiftCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Shifts for active day */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {DAY_NAMES[activeDay]} — {activeShifts.length} shift{activeShifts.length !== 1 ? 's' : ''}
        </p>

        {activeShifts.length > 0 ? (
          <div className="flex flex-col gap-2">
            {activeShifts.map(shift => (
              <div
                key={shift.id}
                className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-800 tabular-nums">
                    {shift.startTime} – {shift.endTime}
                  </span>
                  <RoleBadge role={shift.roleRequired} />
                  <span className="text-xs text-gray-500">×{shift.quantityRequired} staff</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteShift(shift.id)}
                  className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50"
                  aria-label="Remove shift"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">No shifts yet. Add one below.</p>
        )}
      </div>

      {/* Add shift form */}
      <form onSubmit={handleAddShift} className="rounded-lg border border-dashed border-gray-300 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add shift</p>
        <div className="flex flex-wrap items-end gap-3">
          <TimeSelect label="Start time" value={startTime} onChange={setStartTime} />
          <TimeSelect label="End time" value={endTime} onChange={setEndTime} />

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Role</span>
            <select
              className={inputClass}
              value={roleRequired}
              onChange={e => setRoleRequired(e.target.value as Role)}
            >
              <option value={Role.Manager}>Manager</option>
              <option value={Role.AssistantManager}>Assistant Manager</option>
              <option value={Role.SalesAssistant}>Sales Assistant</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">Staff needed</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuantityRequired(q => Math.max(1, q - 1))}
                className="w-8 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 text-lg leading-none"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium text-gray-800">{quantityRequired}</span>
              <button
                type="button"
                onClick={() => setQuantityRequired(q => q + 1)}
                className="w-8 h-9 flex items-center justify-center rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 text-lg leading-none"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Add shift
          </button>
        </div>
      </form>
    </div>
  );
};
