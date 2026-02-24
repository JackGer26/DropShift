import mongoose, { Document, Schema } from 'mongoose';

export enum Role {
  Manager = 'Manager',
  AssistantManager = 'Assistant Manager',
  SalesAssistant = 'Sales Assistant',
}

export interface IStaff extends Document {
  name: string;
  role: Role;
  contractedHours?: number;
  locationIds: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const StaffSchema = new Schema<IStaff>({
  name: { type: String, required: true },
  role: { type: String, enum: Object.values(Role), required: true },
  contractedHours: { type: Number, min: 0 },
  locationIds: [{ type: Schema.Types.ObjectId, ref: 'Location' }],
}, { timestamps: true });

export const Staff = mongoose.model<IStaff>('Staff', StaffSchema);
