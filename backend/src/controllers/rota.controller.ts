// src/controllers/rota.controller.ts
// Controller for Rota operations (create, read, update)
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Rota } from '../models/Rota.model';
import { RotaTemplate } from '../models/RotaTemplate.model';
import { AppError } from '../middleware/AppError';
import { catchAsync } from '../middleware/catchAsync';
import { CopyPreviousWeekInput } from '../validation/rota.schemas';

// TypeScript interfaces for staff rota response
interface StaffShift {
  dayOfWeek: number;
  shiftTemplateId: string;
}

interface StaffRotaResponse {
  weekStartDate: string;
  locationId: string;
  shifts: StaffShift[];
}

// Create a new rota
export const createRota = catchAsync(async (req: Request, res: Response) => {
  const { locationId, templateId, weekStartDate, status, days, name } = req.body;
  const rota = new Rota({ name, locationId, templateId, weekStartDate, status, days });
  const savedRota = await rota.save();
  res.status(201).json({ success: true, data: savedRota });
});

// Get all rotas
export const getAllRotas = catchAsync(async (req: Request, res: Response) => {
  const { weekStartDate } = req.query;
  let rotas;
  if (typeof weekStartDate === 'string' && weekStartDate.length > 0) {
    rotas = await Rota.find({ weekStartDate });
  } else {
    rotas = await Rota.find();
  }
  res.status(200).json({ success: true, data: rotas });
});

// Get rota by ID
export const getRotaById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const rota = await Rota.findById(id);
  if (!rota) throw new AppError('Rota not found', 404);
  res.status(200).json({ success: true, data: rota });
});

// Update rota (status or days)
export const updateRota = catchAsync(async (req: Request, res: Response) => {
  let { id } = req.params;
  const { status, days, name } = req.body;

  // Ensure id is a string (handle possible array type)
  if (Array.isArray(id)) {
    id = id[0];
  }

  const currentRota = await Rota.findById(id);
  if (!currentRota) throw new AppError('Rota not found', 404);

  // Block editing the shift assignments of a published rota
  if (currentRota.status === 'published' && days !== undefined) {
    throw new AppError('Cannot edit the shifts of a published rota.', 403);
  }

  // If publishing a rota, unpublish any other published rotas for the same week/location
  if (status === 'published') {
    await Rota.updateMany(
      {
        _id: { $ne: new mongoose.Types.ObjectId(id) },
        weekStartDate: currentRota.weekStartDate,
        locationId: currentRota.locationId,
        status: 'published'
      },
      { status: 'draft' }
    );
  }

  const update: any = {};
  if (name !== undefined) update.name = name;
  if (status !== undefined) update.status = status;
  if (days !== undefined) update.days = days;
  const rota = await Rota.findByIdAndUpdate(id, update, { returnDocument: 'after' });
  if (!rota) throw new AppError('Rota not found', 404);
  res.status(200).json({ success: true, data: rota });
});

// Copy previous week's rota to create a new draft
export const copyPreviousWeek = catchAsync(async (req: Request, res: Response) => {
  const { locationId, weekStartDate } = req.body as CopyPreviousWeekInput;

  // Check if rota already exists for this week and location
  const existingRota = await Rota.findOne({ locationId, weekStartDate });
  if (existingRota) {
    throw new AppError('A rota already exists for this week and location', 409);
  }

  // Calculate previous week's date (subtract 7 days)
  const currentDate = new Date(weekStartDate);
  const previousWeekDate = new Date(currentDate);
  previousWeekDate.setDate(currentDate.getDate() - 7);
  const previousWeekStartDate = previousWeekDate.toISOString().split('T')[0];

  // Find previous week's rota
  const previousRota = await Rota.findOne({
    locationId,
    weekStartDate: previousWeekStartDate
  });

  if (!previousRota) {
    throw new AppError(`No rota found for the previous week (${previousWeekStartDate})`, 404);
  }

  // Create new rota by copying previous week's data
  const newRota = new Rota({
    locationId: previousRota.locationId,
    templateId: previousRota.templateId,
    weekStartDate: weekStartDate,
    status: 'draft', // Always create as draft
    days: previousRota.days.map(day => ({
      dayOfWeek: day.dayOfWeek,
      assignments: day.assignments.map(assignment => ({
        staffId: assignment.staffId,
        shiftTemplateId: assignment.shiftTemplateId
      }))
    }))
  });

  const savedRota = await newRota.save();

  res.status(201).json({
    success: true,
    data: {
      rota: savedRota,
      copiedFrom: {
        weekStartDate: previousWeekStartDate,
        rotaId: previousRota._id
      }
    }
  });
});

/**
 * Get published rotas for a specific staff member
 *
 * This endpoint demonstrates:
 * - Data privacy: Only returns rotas where staff is assigned
 * - Performance: Uses MongoDB aggregation pipeline (no in-memory filtering)
 * - Security: Filters out other staff members' assignments
 * - Flexibility: Optional date range filtering
 *
 * @route GET /api/rotas/staff/:staffId
 * @query from - Optional start date (YYYY-MM-DD)
 * @query to - Optional end date (YYYY-MM-DD)
 * @returns Array of rotas containing only this staff member's shifts
 */
export const getStaffRotas = catchAsync(async (req: Request, res: Response) => {
  let { staffId } = req.params;
  const { from, to } = req.query;

  // Ensure staffId is a string (handle possible array type)
  if (Array.isArray(staffId)) {
    staffId = staffId[0];
  }

  // Validate staffId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    throw new AppError('Invalid staffId format. Must be a valid MongoDB ObjectId.', 400);
  }

  // Validate date format if provided
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (from && typeof from === 'string' && !dateRegex.test(from)) {
    throw new AppError('Invalid "from" date format. Expected YYYY-MM-DD', 400);
  }
  if (to && typeof to === 'string' && !dateRegex.test(to)) {
    throw new AppError('Invalid "to" date format. Expected YYYY-MM-DD', 400);
  }

  // Build aggregation pipeline
  // This is more efficient than loading all rotas and filtering in Node.js
  const pipeline: any[] = [
    // Stage 1: Match only published rotas
    {
      $match: {
        status: 'published',
        // Optionally filter by date range
        ...(from && { weekStartDate: { $gte: from as string } }),
        ...(to && { weekStartDate: { $lte: to as string } })
      }
    },
    // Stage 2: Unwind days array to process each day
    {
      $unwind: {
        path: '$days',
        preserveNullAndEmptyArrays: false
      }
    },
    // Stage 3: Unwind assignments to process each assignment
    {
      $unwind: {
        path: '$days.assignments',
        preserveNullAndEmptyArrays: false
      }
    },
    // Stage 4: Filter to only this staff member's assignments
    {
      $match: {
        'days.assignments.staffId': new mongoose.Types.ObjectId(staffId as string)
      }
    },
    // Stage 5: Group back by rota, collecting this staff's shifts
    {
      $group: {
        _id: {
          rotaId: '$_id',
          weekStartDate: '$weekStartDate',
          locationId: '$locationId',
          templateId: '$templateId'
        },
        shifts: {
          $push: {
            dayOfWeek: '$days.dayOfWeek',
            shiftTemplateId: '$days.assignments.shiftTemplateId'
          }
        }
      }
    },
    // Stage 6: Project to clean response format
    {
      $project: {
        _id: 0,
        weekStartDate: '$_id.weekStartDate',
        locationId: { $toString: '$_id.locationId' },
        templateId: { $toString: '$_id.templateId' },
        shifts: 1
      }
    },
    // Stage 7: Sort by week (most recent first)
    {
      $sort: { weekStartDate: -1 }
    }
  ];

  // Execute aggregation
  console.log('Executing aggregation pipeline...');
  const staffRotas = await Rota.aggregate<any>(pipeline);
  console.log(`Found ${staffRotas.length} rotas for staff`);

  // Enrich shifts with template data
  const templateIds = [...new Set(staffRotas.map((r: any) => r.templateId).filter(Boolean))];
  console.log('Template IDs:', templateIds);
  const templateObjectIds = templateIds.map(id => new mongoose.Types.ObjectId(id));
  console.log('Fetching templates...');
  const templates = await RotaTemplate.find({ _id: { $in: templateObjectIds } }).lean();
  console.log(`Found ${templates.length} templates`);
  console.log('First template days:', templates[0]?.days?.length || 0);

  // Create a map of template ID to template for quick lookup
  const templateMap = new Map();
  templates.forEach(template => {
    const shiftMap = new Map();
    if (template.days && Array.isArray(template.days)) {
      template.days.forEach((day: any) => {
        if (day.shifts && Array.isArray(day.shifts)) {
          day.shifts.forEach((shift: any) => {
            const shiftId = shift._id?.toString() || shift.id?.toString();
            if (shiftId) {
              shiftMap.set(shiftId, {
                startTime: shift.startTime,
                endTime: shift.endTime,
                roleRequired: shift.roleRequired
              });
            }
          });
        }
      });
    }
    console.log(`Template ${template._id} has ${shiftMap.size} shifts in map`);
    console.log('Shift IDs in template:', Array.from(shiftMap.keys()));
    templateMap.set(template._id.toString(), shiftMap);
  });

  // Enrich each shift with template data
  const enrichedRotas = staffRotas.map((rota: any) => {
    const shiftMap = templateMap.get(rota.templateId);
    console.log(`Looking up template ${rota.templateId}, found map:`, shiftMap ? `${shiftMap.size} shifts` : 'NOT FOUND');
    const enrichedShifts = rota.shifts.map((shift: any) => {
      const shiftTemplateIdStr = shift.shiftTemplateId?.toString() || shift.shiftTemplateId;
      console.log(`Looking for shift ${shiftTemplateIdStr} in template`);
      const shiftDetails = shiftMap?.get(shiftTemplateIdStr) || {};
      console.log('Found shift details:', shiftDetails);
      return {
        dayOfWeek: shift.dayOfWeek,
        shiftTemplateId: shiftTemplateIdStr,
        startTime: shiftDetails.startTime,
        endTime: shiftDetails.endTime,
        roleRequired: shiftDetails.roleRequired
      };
    });

    return {
      weekStartDate: rota.weekStartDate,
      locationId: rota.locationId,
      shifts: enrichedShifts
    };
  });

  res.status(200).json({
    success: true,
    data: {
      staffId,
      count: enrichedRotas.length,
      rotas: enrichedRotas
    }
  });
});

// Delete a rota by ID
export const deleteRota = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedRota = await Rota.findByIdAndDelete(id);

  if (!deletedRota) throw new AppError('Rota not found', 404);

  res.status(200).json({
    success: true,
    data: {
      id: deletedRota._id,
      weekStartDate: deletedRota.weekStartDate,
      status: deletedRota.status
    }
  });
});
