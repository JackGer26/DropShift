import { api } from './api';
import { Staff } from '../types/staff';

interface ApiResponse<T> { success: boolean; data: T; }

// Fetch all staff
export async function fetchStaff(): Promise<Staff[]> {
  const response = await api.get<ApiResponse<Staff[]>>('/staff');
  return response.data.data;
}

// Create a new staff member
export async function createStaff(data: Partial<Staff>): Promise<Staff> {
  const response = await api.post<ApiResponse<Staff>>('/staff', data);
  return response.data.data;
}

// Update a staff member by ID
export async function updateStaff(id: string, data: Partial<Staff>): Promise<Staff> {
  const response = await api.patch<ApiResponse<Staff>>(`/staff/${id}`, data);
  return response.data.data;
}

// Delete a staff member by ID
export async function deleteStaff(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/staff/${id}`);
  return { message: response.data.message };
}
