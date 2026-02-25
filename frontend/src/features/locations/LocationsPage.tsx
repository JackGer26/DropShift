import React, { useEffect, useState } from 'react';
import { fetchLocations, createLocation, updateLocation, deleteLocation } from '@/services/location.service';
import { Location } from '@/types/location';
import { Button, Card, EmptyState, FormField, Input, PageContainer } from '@/ui';

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [name, setName]           = useState('');
  const [address, setAddress]     = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetchLocations();
    setLocations(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createLocation({ name: name.trim(), address: address.trim() || undefined });
    setName('');
    setAddress('');
    await load();
  }

  async function handleNameBlur(id: string, value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    await updateLocation(id, { name: trimmed });
    await load();
  }

  async function handleAddressBlur(id: string, value: string) {
    await updateLocation(id, { address: value.trim() || undefined });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteLocation(id);
    await load();
  }

  return (
    <PageContainer title="Locations">
      {/* Location list */}
      <Card bodyClassName="divide-y divide-gray-100">
        {locations.map(loc => (
          <div key={loc._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <input
                type="text"
                key={`name-${loc._id}`}
                defaultValue={loc.name}
                onBlur={e => handleNameBlur(loc._id, e.target.value)}
                className="text-sm font-medium text-gray-800 border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none bg-transparent w-full sm:w-40"
              />
              <input
                type="text"
                key={`addr-${loc._id}`}
                defaultValue={loc.address ?? ''}
                placeholder="Address (optional)"
                onBlur={e => handleAddressBlur(loc._id, e.target.value)}
                className="text-sm text-gray-500 border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none bg-transparent w-full sm:flex-1"
              />
            </div>
            <Button variant="danger" size="sm" onClick={() => handleDelete(loc._id)}>
              Delete
            </Button>
          </div>
        ))}
        {locations.length === 0 && (
          <EmptyState
            title="No locations added yet"
            description="Add your first branch or store location using the form below."
          />
        )}
      </Card>

      {/* Add location form */}
      <Card title="Add Location" className="mt-5">
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <FormField label="Name" htmlFor="loc-name">
            <Input
              id="loc-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. High Street"
              required
            />
          </FormField>
          <FormField label="Address" htmlFor="loc-address">
            <Input
              id="loc-address"
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 123 High Street (optional)"
            />
          </FormField>
          <Button type="submit" variant="primary">Add Location</Button>
        </form>
      </Card>
    </PageContainer>
  );
}
