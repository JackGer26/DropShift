import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const LocationSchema = new Schema<ILocation>({
  name: { type: String, required: true },
  address: { type: String },
}, { timestamps: true });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
