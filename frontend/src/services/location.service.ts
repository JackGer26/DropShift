import { api } from './api';
import { Location } from '../types/location';

interface ApiResponse<T> { success: boolean; data: T; }

// Fetch all locations
export async function fetchLocations(): Promise<Location[]> {
  const response = await api.get<ApiResponse<Location[]>>('/locations');
  return response.data.data;
}

// Create a new location
export async function createLocation(data: Partial<Location>): Promise<Location> {
  const response = await api.post<ApiResponse<Location>>('/locations', data);
  return response.data.data;
}

// Update a location by ID
export async function updateLocation(id: string, data: Partial<Location>): Promise<Location> {
  const response = await api.patch<ApiResponse<Location>>(`/locations/${id}`, data);
  return response.data.data;
}

// Delete a location by ID
export async function deleteLocation(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/locations/${id}`);
  return { message: response.data.message };
}
