// src/services/rota.service.ts
// Service for rota API calls
import { api } from './api';
import { Rota } from '../types/rota';

// Create a new rota
export async function createRota(data: Partial<Rota>): Promise<Rota> {
  const response = await api.post<Rota>('/rotas', data);
  return response.data;
}

// Update an existing rota
export async function updateRota(id: string, data: Partial<Rota>): Promise<Rota> {
  const response = await api.put<Rota>(`/rotas/${id}`, data);
  return response.data;
}

// Fetch all rotas
// Fetch all rotas, optionally filtered by weekStartDate
export async function fetchRotas(weekStartDate?: string): Promise<Rota[]> {
  const params = weekStartDate ? { weekStartDate } : undefined;
  const response = await api.get<Rota[]>('/rotas', { params });
  return response.data;
}
