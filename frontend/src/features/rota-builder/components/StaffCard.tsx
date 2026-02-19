import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Staff } from '@/types/staff';
import { RoleBadge } from '@/ui/RoleBadge';

interface StaffCardProps {
  staff: Staff;
  draggable?: boolean;
}

const base =
  'flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-gray-200 bg-white text-sm select-none transition-colors';

export const StaffCard: React.FC<StaffCardProps> = ({ staff, draggable = true }) => {
  if (draggable) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: String(staff.id || staff._id),
      data: { staff },
    });
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`${base} cursor-grab active:cursor-grabbing ${
          isDragging ? 'opacity-40' : 'hover:border-gray-300'
        }`}
      >
        <span className="text-gray-800 font-medium truncate">{staff.name}</span>
        <RoleBadge role={staff.role} />
      </div>
    );
  }

  return (
    <div className={`${base} cursor-default`}>
      <span className="text-gray-800 font-medium truncate">{staff.name}</span>
      <RoleBadge role={staff.role} />
    </div>
  );
};
