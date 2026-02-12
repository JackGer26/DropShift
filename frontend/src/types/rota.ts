import { Role } from './staff';

// Represents a shift with full details
export interface RotaShift {
	id: string; // Unique shift instance id
	shiftTemplateId: string;
	startTime: string;
	endTime: string;
	roleRequired: Role;
	quantityRequired: number;
	assignedStaffIds: string[];
}

// Represents a day in the rota with all shifts
export interface RotaDay {
	dayOfWeek: number; // 0 = Sunday, 6 = Saturday
	shifts: RotaShift[];
}

// Represents a scheduled rota for a week
export interface Rota {
	id: string;
	locationId: string;
	templateId: string;
	weekStartDate: string; // ISO date string (e.g., '2026-02-11')
	days: RotaDay[];
	status: 'draft' | 'published';
}
