import React, { useEffect, useState } from 'react';
import { fetchStaff, createStaff, deleteStaff } from '@/services/staff.service';
import { Staff as StaffType, Role } from '@/types/staff';
import { Button, Card, EmptyState, FormField, Input, PageContainer, RoleBadge } from '@/ui';

const selectClass =
  'text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

export function StaffPage() {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [name, setName]           = useState('');
  const [role, setRole]           = useState<Role>(Role.Manager);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    const staff = await fetchStaff();
    setStaffList(staff);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createStaff({ name, role });
    setName('');
    setRole(Role.Manager);
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
        {staffList.map(s => (
          <div key={s._id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-800">{s.name}</span>
              <RoleBadge role={s.role} />
            </div>
            <Button variant="danger" size="sm" onClick={() => handleDelete(s._id)}>
              Delete
            </Button>
          </div>
        ))}
        {staffList.length === 0 && (
          <EmptyState title="No staff added yet" description="Add your first staff member using the form below." />
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
          <Button type="submit" variant="primary">Add Staff</Button>
        </form>
      </Card>
    </PageContainer>
  );
}
