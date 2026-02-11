import { api } from './api';
import { Staff } from '../types/staff';

// Fetch all staff
export async function fetchStaff(): Promise<Staff[]> {
  const response = await api.get<Staff[]>('/staff');
  return response.data;
}

// Create a new staff member
export async function createStaff(data: Partial<Staff>): Promise<Staff> {
  const response = await api.post<Staff>('/staff', data);
  return response.data;
}

// Delete a staff member by ID
export async function deleteStaff(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/staff/${id}`);
  return response.data;
}
