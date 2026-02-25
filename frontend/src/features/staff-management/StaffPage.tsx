import React, { useEffect, useState } from 'react';
import { fetchStaff, createStaff, updateStaff, deleteStaff } from '@/services/staff.service';
import { fetchLocations } from '@/services/location.service';
import { Staff as StaffType, Role } from '@/types/staff';
import { Location } from '@/types/location';
import { Button, Card, EmptyState, FormField, Input, Modal, PageContainer, RoleBadge } from '@/ui';

const selectClass =
  'text-sm border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

const hoursInputClass =
  'w-16 sm:w-20 text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white text-gray-800 ' +
  'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900';

const INITIAL_VISIBLE = 6;

function LocationCheckboxes({
  locations,
  selected,
  onChange,
}: {
  locations: Location[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (locations.length === 0) return <p className="text-xs text-gray-400">No locations available.</p>;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {locations.map(loc => {
        const checked = selected.includes(loc._id);
        return (
          <label key={loc._id} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={checked}
              onChange={() =>
                onChange(checked ? selected.filter(id => id !== loc._id) : [...selected, loc._id])
              }
              className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            {loc.name}
          </label>
        );
      })}
    </div>
  );
}

export function StaffPage() {
  const [staffList, setStaffList]         = useState<StaffType[]>([]);
  const [locations, setLocations]         = useState<Location[]>([]);
  const [showAll, setShowAll]             = useState(false);
  const [name, setName]                   = useState('');
  const [role, setRole]                   = useState<Role>(Role.Manager);
  const [hours, setHours]                 = useState('');
  const [locationIds, setLocationIds]     = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [staff, locs] = await Promise.all([fetchStaff(), fetchLocations()]);
    setStaffList(staff);
    setLocations(locs);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const contractedHours = hours !== '' ? Number(hours) : undefined;
    await createStaff({ name, role, contractedHours, locationIds });
    setName('');
    setRole(Role.Manager);
    setHours('');
    setLocationIds([]);
    await loadData();
  }

  async function handleHoursBlur(id: string, value: string) {
    const contractedHours = value !== '' ? Number(value) : undefined;
    await updateStaff(id, { contractedHours });
    await loadData();
  }

  async function handleLocationChange(staffId: string, ids: string[]) {
    await updateStaff(staffId, { locationIds: ids });
    await loadData();
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    await deleteStaff(confirmDeleteId);
    setConfirmDeleteId(null);
    await loadData();
  }

  return (
    <PageContainer title="Staff">
      {/* Staff list */}
      <Card bodyClassName="divide-y divide-gray-100">
        {(showAll ? staffList : staffList.slice(0, INITIAL_VISIBLE)).map(s => (
          <div key={s._id} className="px-4 py-3 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                <Button variant="danger" size="sm" onClick={() => setConfirmDeleteId(s._id)}>
                  Delete
                </Button>
              </div>
            </div>
            {locations.length > 0 && (
              <div className="pl-0.5">
                <LocationCheckboxes
                  locations={locations}
                  selected={s.locationIds ?? []}
                  onChange={ids => handleLocationChange(s._id, ids)}
                />
              </div>
            )}
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
              {showAll ? 'Show less' : `Show all ${staffList.length} staff members`}
            </button>
          </div>
        )}
      </Card>

      {/* Add staff form */}
      <Card title="Add Staff" className="mt-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
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
          </div>
          {locations.length > 0 && (
            <FormField label="Locations" htmlFor="staff-locations">
              <LocationCheckboxes
                locations={locations}
                selected={locationIds}
                onChange={setLocationIds}
              />
            </FormField>
          )}
          <Button type="submit" variant="primary">Add Staff</Button>
        </form>
      </Card>
      <Modal
        isOpen={confirmDeleteId !== null}
        title="Delete staff member?"
        message={`Are you sure you want to delete ${staffList.find(s => s._id === confirmDeleteId)?.name ?? 'this staff member'}? This action cannot be undone.`}
        confirmLabel="Delete"
        isDangerous
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </PageContainer>
  );
}
