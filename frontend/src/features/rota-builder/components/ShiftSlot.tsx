import React, { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ShiftTemplate } from '@/types/template';
import { RotaShift } from '@/types/rota';
import { Staff } from '@/types/staff';
import { RoleBadge } from '@/ui/RoleBadge';

type ShiftSlotProps = {
  shift: ShiftTemplate | RotaShift;
  staff?: Staff[];
  weeklyHours?: Map<string, number>;
  dayOfWeek?: number;
  onSelectShift?: (shiftTemplateId: string, dayOfWeek: number) => void;
  onRemoveStaff?: (staffId: string) => void;
};

export const ShiftSlot: React.FC<ShiftSlotProps> = ({ shift, staff, weeklyHours, dayOfWeek, onSelectShift, onRemoveStaff }) => {
  const [invalidDrop, setInvalidDrop] = useState(false);
  const droppableId = String((shift as any).shiftTemplateId || shift.id);
  const { isOver, setNodeRef, active } = useDroppable({ id: droppableId });

  // Map assignedStaffIds → { id, name } pairs, compute fill state
  let assignedStaff: { id: string; name: string }[] = [];
  let filled = 0;
  let total = 0;
  let isFull = false;
  if ('assignedStaffIds' in shift && Array.isArray(shift.assignedStaffIds) && staff) {
    assignedStaff = shift.assignedStaffIds
      .map(id => { const member = staff.find(s => s._id === id); return member ? { id, name: member.name } : null; })
      .filter(Boolean) as { id: string; name: string }[];
    filled = shift.assignedStaffIds.length;
    total = shift.quantityRequired;
    isFull = filled >= total;
  }

  // Detect invalid drop (role mismatch, duplicate, over capacity) → red flash + shake
  React.useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    if (isOver && active && 'assignedStaffIds' in shift && staff) {
      const draggedStaff = (active.data?.current as { staff?: Staff })?.staff;
      if (!draggedStaff || draggedStaff.role == null) {
        setInvalidDrop(false);
        return;
      }
      const alreadyAssigned = shift.assignedStaffIds?.includes(draggedStaff._id ?? '');
      const roleMismatch = draggedStaff.role !== shift.roleRequired;
      const overCapacity = filled >= total;
      if (roleMismatch || alreadyAssigned || overCapacity) {
        setInvalidDrop(true);
      } else {
        setInvalidDrop(false);
      }
    } else {
      setInvalidDrop(false);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isOver, active, shift, staff, filled, total]);

  // Slot visual state: invalid > full > drag-over > default
  const slotClass = invalidDrop
    ? 'border-red-400 bg-red-50 animate-shake'
    : isFull
    ? 'border-green-200 bg-green-50'
    : isOver
    ? 'border-blue-300 bg-blue-50'
    : 'border-gray-200 bg-white hover:border-gray-300';

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border p-3 transition-colors duration-150 cursor-pointer ${slotClass}`}
      onClick={() => {
        if (onSelectShift && (shift as any).shiftTemplateId && typeof dayOfWeek === 'number') {
          onSelectShift((shift as any).shiftTemplateId, dayOfWeek);
        }
      }}
    >
      {/* Time range + fill counter */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-800 tabular-nums">
          {shift.startTime} – {shift.endTime}
        </span>
        <span className={`text-xs font-medium tabular-nums ${isFull ? 'text-green-600' : 'text-gray-400'}`}>
          {filled}/{total}
        </span>
      </div>

      {/* Role badge */}
      <div className="mb-2">
        <RoleBadge role={shift.roleRequired} />
      </div>

      {/* Assigned staff */}
      {assignedStaff.length > 0 && (
        <ul className="space-y-0.5 mt-1">
          {assignedStaff.map(({ id, name }) => {
            const staffMember = staff?.find(s => s._id === id);
            const memberHours = weeklyHours?.get(id) ?? 0;
            const isOverContracted =
              staffMember?.contractedHours !== undefined &&
              memberHours > staffMember.contractedHours;
            return (
              <li key={id} className="flex items-center justify-between gap-1">
                <span className={`text-xs leading-tight flex items-center gap-1 ${isOverContracted ? 'text-amber-600 font-medium' : 'text-gray-600'}`}>
                  {name}
                  {isOverContracted && (
                    <span title={`Over contracted hours (${staffMember!.contractedHours}h contracted, ${memberHours.toFixed(1)}h this week)`}>⚠</span>
                  )}
                </span>
                {onRemoveStaff && (
                  <button
                    className="shrink-0 text-gray-300 hover:text-red-500 transition-colors leading-none text-sm"
                    onClick={e => { e.stopPropagation(); onRemoveStaff(id); }}
                    aria-label={`Remove ${name}`}
                  >×</button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ShiftSlot;
