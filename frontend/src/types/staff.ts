// Possible staff roles in the rota system
export enum Role {
	Manager = 'Manager',
	AssistantManager = 'Assistant Manager',
	SalesAssistant = 'Sales Assistant',
}

// Represents a staff member
export interface Staff {
	_id: string;
	id?: string; // MongoDB string ID
	name: string;
	role: Role;
	contractedHours?: number;
	locationIds: string[]; // IDs of locations where staff can work
}
