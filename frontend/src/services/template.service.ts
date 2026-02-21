import { api } from './api';
import { RotaTemplate } from '../types/template';

interface ApiResponse<T> { success: boolean; data: T; }

// Fetch all templates
export async function fetchTemplates(): Promise<RotaTemplate[]> {
  const response = await api.get<ApiResponse<RotaTemplate[]>>('/templates');
  return response.data.data;
}

// Create a new template
export async function createTemplate(data: Partial<RotaTemplate>): Promise<RotaTemplate> {
  const response = await api.post<ApiResponse<RotaTemplate>>('/templates', data);
  return response.data.data;
}

// Update a template by ID
export async function updateTemplate(id: string, data: Partial<RotaTemplate>): Promise<RotaTemplate> {
  const response = await api.put<ApiResponse<RotaTemplate>>(`/templates/${id}`, data);
  return response.data.data;
}

// Delete a template by ID
export async function deleteTemplate(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ success: boolean; message: string }>(`/templates/${id}`);
  return { message: response.data.message };
}
