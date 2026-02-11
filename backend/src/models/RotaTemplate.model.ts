import mongoose, { Document, Schema } from 'mongoose';
import { Role } from './Staff.model';

export interface IShiftTemplate {
  startTime: string;
  endTime: string;
  roleRequired: Role;
  quantityRequired: number;
}

export interface IDayTemplate {
  dayOfWeek: number;
  shifts: IShiftTemplate[];
}

export interface IRotaTemplate extends Document {
  name: string;
  locationId?: mongoose.Types.ObjectId;
  days: IDayTemplate[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ShiftTemplateSchema = new Schema<IShiftTemplate>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  roleRequired: { type: String, enum: Object.values(Role), required: true },
  quantityRequired: { type: Number, required: true },
}, { _id: false });

const DayTemplateSchema = new Schema<IDayTemplate>({
  dayOfWeek: { type: Number, required: true },
  shifts: { type: [ShiftTemplateSchema], required: true },
}, { _id: false });

const RotaTemplateSchema = new Schema<IRotaTemplate>({
  name: { type: String, required: true },
  locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
  days: { type: [DayTemplateSchema], required: true },
}, { timestamps: true });

export const RotaTemplate = mongoose.model<IRotaTemplate>('RotaTemplate', RotaTemplateSchema);
