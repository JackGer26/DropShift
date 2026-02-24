import React, { useEffect, useState } from 'react';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '@/services/staff.service';
import { Staff as StaffType, Role } from '@/types/staff';
import { Button, Card, EmptyState, FormField, Input, PageContainer, RoleBadge } from '@/ui';

const selectClass =
  'text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

const hoursInputClass =
  'w-20 text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

const INITIAL_VISIBLE = 6;

export function StaffPage() {
  const [staffList, setStaffList]   = useState<StaffType[]>([]);
  const [showAll, setShowAll]       = useState(false);
  const [name, setName]             = useState('');
  const [role, setRole]             = useState<Role>(Role.Manager);
  const [hours, setHours]           = useState('');

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const staff = await fetchStaff();
    setStaffList(staff);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const contractedHours = hours !== '' ? Number(hours) : undefined;
    await createStaff({ name, role, contractedHours });
    setName('');
    setRole(Role.Manager);
    setHours('');
    await loadStaff();
  }

  async function handleHoursBlur(id: string, value: string) {
    const contractedHours = value !== '' ? Number(value) : undefined;
    await updateStaff(id, { contractedHours });
    await loadStaff();
  }

  async function handleDelete(id: string) {
    await deleteStaff(id);
    await loadStaff();
  }

  return (
    <PageContainer title="Staff">
      {/* Staff list */}
      <Card bodyClassName="divide-y divide-gray-100">
        {(showAll ? staffList : staffList.slice(0, INITIAL_VISIBLE)).map(s => (
          <div key={s._id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              <RoleBadge role={s.role} />
              {s.contractedHours !== undefined && (
                <span className="text-xs text-gray-500">{s.contractedHours}h</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                Hours
                <input
                  type="number"
                  min={0}
                  max={168}
                  step={0.5}
                  key={s._id}
                  defaultValue={s.contractedHours ?? ''}
                  placeholder="—"
                  className={hoursInputClass}
                  onBlur={e => handleHoursBlur(s._id, e.target.value)}
                />
              </label>
              <Button variant="danger" size="sm" onClick={() => handleDelete(s._id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {staffList.length === 0 && (
          <EmptyState title="No staff added yet" description="Add your first staff member using the form below." />
        )}
        {staffList.length > INITIAL_VISIBLE && (
          <div className="px-4 py-3">
            <button
              onClick={() => setShowAll(prev => !prev)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              {showAll
                ? 'Show less'
                : `Show all ${staffList.length} staff members`}
            </button>
          </div>
        )}
      </Card>

      {/* Add staff form */}
      <Card title="Add Staff" className="mt-5">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <FormField label="Name" htmlFor="staff-name">
            <Input
              id="staff-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              required
            />
          </FormField>
          <FormField label="Role" htmlFor="staff-role">
            <select
              id="staff-role"
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className={selectClass}
            >
              <option value={Role.Manager}>Manager</option>
              <option value={Role.AssistantManager}>Assistant Manager</option>
              <option value={Role.SalesAssistant}>Sales Assistant</option>
            </select>
          </FormField>
          <FormField label="Contracted Hours" htmlFor="staff-hours">
            <Input
              id="staff-hours"
              type="number"
              min={0}
              max={168}
              step={0.5}
              value={hours}
              onChange={e => setHours(e.target.value)}
              placeholder="e.g. 37.5"
            />
          </FormField>
          <Button type="submit" variant="primary">Add Staff</Button>
        </form>
      </Card>
    </PageContainer>
  );
}
