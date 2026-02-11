import mongoose, { Document, Schema } from 'mongoose';

export interface IShiftAssignment {
  staffId: mongoose.Types.ObjectId;
  shiftTemplateId: mongoose.Types.ObjectId;
}

export interface IDayRota {
  dayOfWeek: number;
  assignments: IShiftAssignment[];
}

export interface IRota extends Document {
  locationId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  weekStartDate: string;
  status: 'draft' | 'published';
  days: IDayRota[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ShiftAssignmentSchema = new Schema<IShiftAssignment>({
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  shiftTemplateId: { type: Schema.Types.ObjectId, required: true },
}, { _id: false });

const DayRotaSchema = new Schema<IDayRota>({
  dayOfWeek: { type: Number, required: true },
  assignments: { type: [ShiftAssignmentSchema], required: true },
}, { _id: false });

const RotaSchema = new Schema<IRota>({
  locationId: { type: Schema.Types.ObjectId, ref: 'Location', required: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'RotaTemplate', required: true },
  weekStartDate: { type: String, required: true },
  status: { type: String, enum: ['draft', 'published'], required: true },
  days: { type: [DayRotaSchema], required: true },
}, { timestamps: true });

export const Rota = mongoose.model<IRota>('Rota', RotaSchema);
