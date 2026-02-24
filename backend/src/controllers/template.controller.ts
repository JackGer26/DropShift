import { Request, Response } from 'express';
import { RotaTemplate } from '../models/RotaTemplate.model';
import { AppError } from '../middleware/AppError';
import { catchAsync } from '../middleware/catchAsync';

// Create a new template
export const createTemplate = catchAsync(async (req: Request, res: Response) => {
  const { name, locationId, days } = req.body;
  const template = await RotaTemplate.create({ name, locationId, days });
  res.status(201).json({ success: true, data: template });
});

// Get all templates
export const getAllTemplates = catchAsync(async (_req: Request, res: Response) => {
  const templates = await RotaTemplate.find();
  res.status(200).json({ success: true, data: templates });
});

// Get template by ID
export const getTemplateById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const template = await RotaTemplate.findById(id);
  if (!template) throw new AppError('Template not found', 404);
  res.status(200).json({ success: true, data: template });
});

// Update template by ID
export const updateTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, locationId, days } = req.body;
  const template = await RotaTemplate.findByIdAndUpdate(
    id,
    { name, locationId, days },
    { new: true }
  );
  if (!template) throw new AppError('Template not found', 404);
  res.status(200).json({ success: true, data: template });
});

// Delete template by ID
export const deleteTemplate = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RotaTemplate.findByIdAndDelete(id);
  if (!result) throw new AppError('Template not found', 404);
  res.status(200).json({ success: true, message: 'Template deleted successfully' });
});
