import { Request, Response } from 'express';
import { Location } from '../models/Location.model';
import { AppError } from '../middleware/AppError';
import { catchAsync } from '../middleware/catchAsync';

// Create a new location
export const createLocation = catchAsync(async (req: Request, res: Response) => {
  const { name, address } = req.body;
  const location = await Location.create({ name, address });
  res.status(201).json({ success: true, data: location });
});

// Get all locations (sorted alphabetically)
export const getAllLocations = catchAsync(async (_req: Request, res: Response) => {
  const locations = await Location.find().sort({ name: 1 });
  res.status(200).json({ success: true, data: locations });
});

// Get location by ID
export const getLocationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const location = await Location.findById(id);
  if (!location) throw new AppError('Location not found', 404);
  res.status(200).json({ success: true, data: location });
});

// Update a location
export const updateLocation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, address } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (address !== undefined) update.address = address;
  const location = await Location.findByIdAndUpdate(id, update, { new: true });
  if (!location) throw new AppError('Location not found', 404);
  res.status(200).json({ success: true, data: location });
});

// Delete a location
export const deleteLocation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await Location.findByIdAndDelete(id);
  if (!result) throw new AppError('Location not found', 404);
  res.status(200).json({ success: true, message: 'Location deleted successfully' });
});
