import { Role } from './staff';

// Represents a single shift requirement in a template
export interface ShiftTemplate {
	id: string; // Unique shift template ID
	startTime: string; // ISO time string (e.g., '09:00')
	endTime: string;   // ISO time string (e.g., '17:00')
	roleRequired: Role;
	quantityRequired: number; // Number of staff needed for this role/shift
}

// Represents a day's worth of shift templates
export interface DayTemplate {
	dayOfWeek: number; // 0 = Sunday, 6 = Saturday
	shifts: ShiftTemplate[];
}

// Represents a full rota template for a week
export interface RotaTemplate {
	id: string;
	name: string;
	locationId?: string; // Optional location for the template
	days: DayTemplate[];
}
