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

// Copy previous week's rota
export interface CopyPreviousWeekResponse {
  message: string;
  rota: Rota;
  copiedFrom: {
    weekStartDate: string;
    rotaId: string;
  };
}

export async function copyPreviousWeekRota(
  locationId: string,
  weekStartDate: string
): Promise<CopyPreviousWeekResponse> {
  const response = await api.post<CopyPreviousWeekResponse>('/rotas/copy-previous-week', {
    locationId,
    weekStartDate
  });
  return response.data;
}

// Staff-facing: Get rotas for a specific staff member
export interface StaffShift {
  dayOfWeek: number;
  shiftTemplateId: string;
  startTime?: string;
  endTime?: string;
  roleRequired?: string;
}

export interface StaffRotaItem {
  weekStartDate: string;
  locationId: string;
  shifts: StaffShift[];
}

export interface StaffRotasResponse {
  staffId: string;
  count: number;
  rotas: StaffRotaItem[];
}

export interface FetchStaffRotasParams {
  staffId: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
}

export async function fetchStaffRotas(params: FetchStaffRotasParams): Promise<StaffRotasResponse> {
  const { staffId, from, to } = params;
  const queryParams: Record<string, string> = {};

  if (from) queryParams.from = from;
  if (to) queryParams.to = to;

  const response = await api.get<StaffRotasResponse>(`/rotas/staff/${staffId}`, {
    params: queryParams
  });

  return response.data;
}

// Delete a rota
export interface DeleteRotaResponse {
  message: string;
  deletedRota: {
    id: string;
    weekStartDate: string;
    status: 'draft' | 'published';
  };
}

export async function deleteRota(id: string): Promise<DeleteRotaResponse> {
  const response = await api.delete<DeleteRotaResponse>(`/rotas/${id}`);
  return response.data;
}
