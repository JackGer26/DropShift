import React, { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ShiftTemplate } from '../../types/template';
import { RotaShift } from '../../types/rota';
import { Staff } from '../../types/staff';

type ShiftSlotProps = {
  shift: ShiftTemplate | RotaShift;
  staff?: Staff[];
};

export const ShiftSlot: React.FC<ShiftSlotProps> = ({ shift, staff }) => {
  const [invalidDrop, setInvalidDrop] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const { isOver, setNodeRef, active } = useDroppable({
    id: shift.id,
  });

  // If shift has assignedStaffIds and staff list is provided, map ids to names
  let assignedNames: string[] = [];
  let filled = 0;
  let total = 0;
  let isFull = false;
  if ('assignedStaffIds' in shift && Array.isArray(shift.assignedStaffIds) && staff) {
    assignedNames = shift.assignedStaffIds
      .map(id => staff.find(s => s._id === id)?.name)
      .filter(Boolean) as string[];
    filled = shift.assignedStaffIds.length;
    total = shift.quantityRequired;
    isFull = filled >= total;
  }

  // Red flash animation for invalid drop
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
      console.log('[ShiftSlot] Hover:', {
        draggedStaff,
        slotRole: shift.roleRequired,
        roleMismatch,
        alreadyAssigned,
        overCapacity,
        isOver,
        shift,
      });
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

  // Simple shake animation
  const shakeStyle = invalidDrop
    ? {
        animation: 'shake 0.3s',
        border: '2px solid #e53935',
        boxShadow: '0 0 8px #e53935',
      }
    : {};

  // Green border if full
  const borderStyle = isFull
    ? { border: '2px solid #43a047' }
    : { border: '1px solid #888' };

  return (
    <div
      ref={el => {
        setNodeRef(el);
        slotRef.current = el;
      }}
      style={{
        ...borderStyle,
        ...shakeStyle,
        padding: '8px',
        marginBottom: '8px',
        background: isOver ? '#e0f7fa' : '#fff',
        transition: 'border 0.2s, box-shadow 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>{shift.startTime} - {shift.endTime}</strong>
        <span style={{ fontSize: 13, color: isFull ? '#43a047' : '#888', marginLeft: 8 }}>
          {filled} / {total} filled
        </span>
      </div>
      <div>Role: {shift.roleRequired}</div>
      <div>Quantity: {shift.quantityRequired}</div>
      <div>Assigned:
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {assignedNames.map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default ShiftSlot;
