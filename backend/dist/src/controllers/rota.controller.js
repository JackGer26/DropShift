"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRota = createRota;
exports.getAllRotas = getAllRotas;
exports.getRotaById = getRotaById;
exports.updateRota = updateRota;
exports.copyPreviousWeek = copyPreviousWeek;
exports.getStaffRotas = getStaffRotas;
exports.deleteRota = deleteRota;
const mongoose_1 = __importDefault(require("mongoose"));
const Rota_model_1 = require("../models/Rota.model");
const RotaTemplate_model_1 = require("../models/RotaTemplate.model");
// Create a new rota
async function createRota(req, res) {
    try {
        const { locationId, templateId, weekStartDate, status, days } = req.body;
        const rota = new Rota_model_1.Rota({ locationId, templateId, weekStartDate, status, days });
        const savedRota = await rota.save();
        return res.status(201).json(savedRota);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to create rota', error });
    }
}
// Get all rotas
async function getAllRotas(req, res) {
    try {
        const { weekStartDate } = req.query;
        let rotas;
        if (typeof weekStartDate === 'string' && weekStartDate.length > 0) {
            rotas = await Rota_model_1.Rota.find({ weekStartDate });
        }
        else {
            rotas = await Rota_model_1.Rota.find();
        }
        return res.status(200).json(rotas);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to fetch rotas', error });
    }
}
// Get rota by ID
async function getRotaById(req, res) {
    try {
        const { id } = req.params;
        const rota = await Rota_model_1.Rota.findById(id);
        if (!rota) {
            return res.status(404).json({ message: 'Rota not found' });
        }
        return res.status(200).json(rota);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to fetch rota', error });
    }
}
// Update rota (status or days)
async function updateRota(req, res) {
    try {
        const { id } = req.params;
        const { status, days } = req.body;
        const update = {};
        if (status !== undefined)
            update.status = status;
        if (days !== undefined)
            update.days = days;
        const rota = await Rota_model_1.Rota.findByIdAndUpdate(id, update, { new: true });
        if (!rota) {
            return res.status(404).json({ message: 'Rota not found' });
        }
        return res.status(200).json(rota);
    }
    catch (error) {
        return res.status(500).json({ message: 'Failed to update rota', error });
    }
}
// Copy previous week's rota to create a new draft
async function copyPreviousWeek(req, res) {
    try {
        const { locationId, weekStartDate } = req.body;
        // Validate required fields
        if (!locationId || !weekStartDate) {
            return res.status(400).json({
                message: 'Missing required fields: locationId and weekStartDate are required'
            });
        }
        // Validate weekStartDate format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(weekStartDate)) {
            return res.status(400).json({
                message: 'Invalid weekStartDate format. Expected YYYY-MM-DD'
            });
        }
        // Check if rota already exists for this week and location
        const existingRota = await Rota_model_1.Rota.findOne({ locationId, weekStartDate });
        if (existingRota) {
            return res.status(409).json({
                message: 'A rota already exists for this week and location. Cannot copy.',
                existingRotaId: existingRota._id
            });
        }
        // Calculate previous week's date (subtract 7 days)
        const currentDate = new Date(weekStartDate);
        const previousWeekDate = new Date(currentDate);
        previousWeekDate.setDate(currentDate.getDate() - 7);
        const previousWeekStartDate = previousWeekDate.toISOString().split('T')[0];
        // Find previous week's rota
        const previousRota = await Rota_model_1.Rota.findOne({
            locationId,
            weekStartDate: previousWeekStartDate
        });
        if (!previousRota) {
            return res.status(404).json({
                message: 'No rota found for the previous week',
                previousWeekStartDate
            });
        }
        // Create new rota by copying previous week's data
        const newRota = new Rota_model_1.Rota({
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
        return res.status(201).json({
            message: 'Successfully copied previous week\'s rota',
            rota: savedRota,
            copiedFrom: {
                weekStartDate: previousWeekStartDate,
                rotaId: previousRota._id
            }
        });
    }
    catch (error) {
        console.error('Error copying previous week:', error);
        return res.status(500).json({
            message: 'Failed to copy previous week\'s rota',
            error
        });
    }
}
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
async function getStaffRotas(req, res) {
    try {
        let { staffId } = req.params;
        const { from, to } = req.query;
        // Ensure staffId is a string (handle possible array type)
        if (Array.isArray(staffId)) {
            staffId = staffId[0];
        }
        // Validate staffId is a valid MongoDB ObjectId
        if (!mongoose_1.default.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({
                message: 'Invalid staffId format. Must be a valid MongoDB ObjectId.'
            });
        }
        // Validate date format if provided
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (from && typeof from === 'string' && !dateRegex.test(from)) {
            return res.status(400).json({
                message: 'Invalid "from" date format. Expected YYYY-MM-DD'
            });
        }
        if (to && typeof to === 'string' && !dateRegex.test(to)) {
            return res.status(400).json({
                message: 'Invalid "to" date format. Expected YYYY-MM-DD'
            });
        }
        // Build aggregation pipeline
        // This is more efficient than loading all rotas and filtering in Node.js
        const pipeline = [
            // Stage 1: Match only published rotas
            {
                $match: {
                    status: 'published',
                    // Optionally filter by date range
                    ...(from && { weekStartDate: { $gte: from } }),
                    ...(to && { weekStartDate: { $lte: to } })
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
                    'days.assignments.staffId': new mongoose_1.default.Types.ObjectId(staffId)
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
        const staffRotas = await Rota_model_1.Rota.aggregate(pipeline);
        console.log(`Found ${staffRotas.length} rotas for staff`);
        // Enrich shifts with template data
        const templateIds = [...new Set(staffRotas.map((r) => r.templateId).filter(Boolean))];
        console.log('Template IDs:', templateIds);
        const templateObjectIds = templateIds.map(id => new mongoose_1.default.Types.ObjectId(id));
        console.log('Fetching templates...');
        const templates = await RotaTemplate_model_1.RotaTemplate.find({ _id: { $in: templateObjectIds } });
        console.log(`Found ${templates.length} templates`);
        // Create a map of template ID to template for quick lookup
        const templateMap = new Map();
        templates.forEach(template => {
            const shiftMap = new Map();
            if (template.days && Array.isArray(template.days)) {
                template.days.forEach((day) => {
                    if (day.shifts && Array.isArray(day.shifts)) {
                        day.shifts.forEach((shift) => {
                            shiftMap.set(shift._id.toString(), {
                                startTime: shift.startTime,
                                endTime: shift.endTime,
                                roleRequired: shift.roleRequired
                            });
                        });
                    }
                });
            }
            templateMap.set(template._id.toString(), shiftMap);
        });
        // Enrich each shift with template data
        const enrichedRotas = staffRotas.map((rota) => {
            const shiftMap = templateMap.get(rota.templateId);
            const enrichedShifts = rota.shifts.map((shift) => {
                const shiftTemplateIdStr = shift.shiftTemplateId?.toString() || shift.shiftTemplateId;
                const shiftDetails = shiftMap?.get(shiftTemplateIdStr) || {};
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
        // Return response
        return res.status(200).json({
            staffId,
            count: enrichedRotas.length,
            rotas: enrichedRotas
        });
    }
    catch (error) {
        console.error('Error fetching staff rotas:', error);
        return res.status(500).json({
            message: 'Failed to fetch staff rotas',
            error
        });
    }
}
// Delete a rota by ID
async function deleteRota(req, res) {
    try {
        const { id } = req.params;
        // Find and delete the rota
        const deletedRota = await Rota_model_1.Rota.findByIdAndDelete(id);
        if (!deletedRota) {
            return res.status(404).json({
                message: 'Rota not found'
            });
        }
        return res.status(200).json({
            message: 'Rota deleted successfully',
            deletedRota: {
                id: deletedRota._id,
                weekStartDate: deletedRota.weekStartDate,
                status: deletedRota.status
            }
        });
    }
    catch (error) {
        console.error('Error deleting rota:', error);
        return res.status(500).json({
            message: 'Failed to delete rota',
            error
        });
    }
}
