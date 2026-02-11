import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Staff } from '../../types/staff';

interface StaffCardProps {
  staff: Staff;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: staff.id || staff._id,
    data: { staff },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        border: '1px solid #ccc',
        padding: '8px',
        marginBottom: '4px',
        background: '#fff',
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    >
      <strong>{staff.role}</strong>: {staff.name}
    </div>
  );
};
