import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Staff } from '../../types/staff';

interface StaffCardProps {
  staff: Staff;
  draggable?: boolean;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, draggable = true }) => {
  if (draggable) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: String(staff.id || staff._id),
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
  } else {
    return (
      <div
        style={{
          border: '1px solid #ccc',
          padding: '8px',
          marginBottom: '4px',
          background: '#fff',
          cursor: 'default',
        }}
      >
        <strong>{staff.role}</strong>: {staff.name}
      </div>
    );
  }
};
