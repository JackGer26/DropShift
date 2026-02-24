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

function abbreviateName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length < 2) return fullName;
  const last = parts[parts.length - 1];
  return [...parts.slice(0, -1), `${last[0]}.`].join(' ');
}

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
        <span className="text-gray-800 font-medium">{abbreviateName(staff.name)}</span>
        <div className="flex items-center gap-1.5">
          {staff.contractedHours !== undefined && (
            <span className="text-xs text-gray-400">{staff.contractedHours}h</span>
          )}
          <RoleBadge role={staff.role} abbreviated />
        </div>
      </div>
    );
  }

  return (
    <div className={`${base} cursor-default`}>
      <span className="text-gray-800 font-medium">{abbreviateName(staff.name)}</span>
      <div className="flex items-center gap-1.5">
        {staff.contractedHours !== undefined && (
          <span className="text-xs text-gray-400">{staff.contractedHours}h</span>
        )}
        <RoleBadge role={staff.role} abbreviated />
      </div>
    </div>
  );
};
