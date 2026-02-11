import React, { useEffect, useState } from 'react';
import { fetchStaff, createStaff, deleteStaff } from '../services/staff.service';
import { Staff as StaffType, Role } from '../types/staff';


export function Staff() {
  const [staffList, setStaffList] = useState<StaffType[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>(Role.Manager);

  useEffect(() => {
    loadStaff();
  }, []);

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
    <div>
      <h2>Staff List</h2>
      <ul>
        {staffList.map((s) => (
          <li key={s._id}>
            {s.name} ({s.role})
            <button onClick={() => handleDelete(s._id)} style={{ marginLeft: 8 }}>Delete</button>
          </li>
        ))}
      </ul>

      <h3>Add Staff</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <select value={role} onChange={e => setRole(e.target.value as Role)}>
          <option value={Role.Manager}>Manager</option>
          <option value={Role.AssistantManager}>Assistant Manager</option>
          <option value={Role.SalesAssistant}>Sales Assistant</option>
        </select>
        <button type="submit">Add Staff</button>
      </form>
    </div>
  );
}
