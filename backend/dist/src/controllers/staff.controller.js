"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStaff = exports.getStaffById = exports.getAllStaff = exports.createStaff = void 0;
const Staff_model_1 = require("../models/Staff.model");
// Create a new staff member
const createStaff = async (req, res) => {
    try {
        const { name, role, locationIds } = req.body;
        const staff = await Staff_model_1.Staff.create({ name, role, locationIds });
        return res.status(201).json(staff);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to create staff', details: error });
    }
};
exports.createStaff = createStaff;
// Get all staff members
const getAllStaff = async (_req, res) => {
    try {
        const staffList = await Staff_model_1.Staff.find();
        return res.status(200).json(staffList);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch staff', details: error });
    }
};
exports.getAllStaff = getAllStaff;
// Get staff by ID
const getStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff_model_1.Staff.findById(id);
        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        return res.status(200).json(staff);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch staff', details: error });
    }
};
exports.getStaffById = getStaffById;
// Delete staff by ID
const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Staff_model_1.Staff.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Staff not found' });
        }
        return res.status(200).json({ message: 'Staff deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to delete staff', details: error });
    }
};
exports.deleteStaff = deleteStaff;
