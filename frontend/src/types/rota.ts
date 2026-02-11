// Represents a staff assignment to a shift
export interface ShiftAssignment {
	staffId: string;
	shiftTemplateId: string;
}

// Represents all shift assignments for a single day
export interface DayRota {
	dayOfWeek: number; // 0 = Sunday, 6 = Saturday
	assignments: ShiftAssignment[];
}

// Represents a scheduled rota for a week
export interface Rota {
	id: string;
	locationId: string;
	templateId: string;
	weekStartDate: string; // ISO date string (e.g., '2026-02-11')
	days: DayRota[];
	status: 'draft' | 'published';
}
