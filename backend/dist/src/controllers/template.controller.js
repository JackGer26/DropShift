"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.getTemplateById = exports.getAllTemplates = exports.createTemplate = void 0;
const RotaTemplate_model_1 = require("../models/RotaTemplate.model");
// Create a new template
const createTemplate = async (req, res) => {
    try {
        const { name, locationId, days } = req.body;
        const template = await RotaTemplate_model_1.RotaTemplate.create({ name, locationId, days });
        return res.status(201).json(template);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to create template', details: error });
    }
};
exports.createTemplate = createTemplate;
// Get all templates
const getAllTemplates = async (_req, res) => {
    try {
        const templates = await RotaTemplate_model_1.RotaTemplate.find();
        return res.status(200).json(templates);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch templates', details: error });
    }
};
exports.getAllTemplates = getAllTemplates;
// Get template by ID
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await RotaTemplate_model_1.RotaTemplate.findById(id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json(template);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to fetch template', details: error });
    }
};
exports.getTemplateById = getTemplateById;
// Update template by ID
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, locationId, days } = req.body;
        const template = await RotaTemplate_model_1.RotaTemplate.findByIdAndUpdate(id, { name, locationId, days }, { new: true });
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json(template);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to update template', details: error });
    }
};
exports.updateTemplate = updateTemplate;
// Delete template by ID
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await RotaTemplate_model_1.RotaTemplate.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Template not found' });
        }
        return res.status(200).json({ message: 'Template deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to delete template', details: error });
    }
};
exports.deleteTemplate = deleteTemplate;
