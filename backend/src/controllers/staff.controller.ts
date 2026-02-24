import { Request, Response } from 'express';
import { Staff } from '../models/Staff.model';
import { AppError } from '../middleware/AppError';
import { catchAsync } from '../middleware/catchAsync';

// Create a new staff member
export const createStaff = catchAsync(async (req: Request, res: Response) => {
  const { name, role, contractedHours, locationIds } = req.body;
  const staff = await Staff.create({ name, role, contractedHours, locationIds });
  res.status(201).json({ success: true, data: staff });
});

// Update a staff member
export const updateStaff = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, contractedHours, locationIds } = req.body;
  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (contractedHours !== undefined) update.contractedHours = contractedHours;
  if (locationIds !== undefined) update.locationIds = locationIds;
  const staff = await Staff.findByIdAndUpdate(id, update, { new: true });
  if (!staff) throw new AppError('Staff not found', 404);
  res.status(200).json({ success: true, data: staff });
});

// Get all staff members
export const getAllStaff = catchAsync(async (_req: Request, res: Response) => {
  const staffList = await Staff.find();
  res.status(200).json({ success: true, data: staffList });
});

// Get staff by ID
export const getStaffById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const staff = await Staff.findById(id);
  if (!staff) throw new AppError('Staff not found', 404);
  res.status(200).json({ success: true, data: staff });
});

// Delete staff by ID
export const deleteStaff = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await Staff.findByIdAndDelete(id);
  if (!result) throw new AppError('Staff not found', 404);
  res.status(200).json({ success: true, message: 'Staff deleted successfully' });
});
