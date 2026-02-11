import { api } from './api';
import { RotaTemplate } from '../types/template';

// Fetch all templates
export async function fetchTemplates(): Promise<RotaTemplate[]> {
  const response = await api.get<RotaTemplate[]>('/templates');
  return response.data;
}

// Create a new template
export async function createTemplate(data: Partial<RotaTemplate>): Promise<RotaTemplate> {
  const response = await api.post<RotaTemplate>('/templates', data);
  return response.data;
}

// Update a template by ID
export async function updateTemplate(id: string, data: Partial<RotaTemplate>): Promise<RotaTemplate> {
  const response = await api.put<RotaTemplate>(`/templates/${id}`, data);
  return response.data;
}

// Delete a template by ID
export async function deleteTemplate(id: string): Promise<{ message: string }> {
  const response = await api.delete<{ message: string }>(`/templates/${id}`);
  return response.data;
}
