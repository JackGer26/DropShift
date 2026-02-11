import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { ShiftTemplate } from '../../types/template';

interface ShiftSlotProps {
  shift: ShiftTemplate;
  assignedStaff?: string[];
}

export const ShiftSlot: React.FC<ShiftSlotProps> = ({ shift, assignedStaff = [] }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: shift.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: '1px solid #888',
        padding: '8px',
        marginBottom: '8px',
        background: isOver ? '#e0f7fa' : '#fff',
      }}
    >
      <div><strong>{shift.startTime} - {shift.endTime}</strong></div>
      <div>Role: {shift.roleRequired}</div>
      <div>Quantity: {shift.quantityRequired}</div>
      <div>Assigned:
        <ul>
          {assignedStaff.map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
