"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/rota.routes.ts
// Express router for rota endpoints
const express_1 = require("express");
const rota_controller_1 = require("../controllers/rota.controller");
const router = (0, express_1.Router)();
// Create rota
router.post('/', rota_controller_1.createRota);
// Copy previous week's rota
router.post('/copy-previous-week', rota_controller_1.copyPreviousWeek);
// Get published rotas for a specific staff member (staff-facing endpoint)
router.get('/staff/:staffId', rota_controller_1.getStaffRotas);
// Get all rotas
router.get('/', rota_controller_1.getAllRotas);
// Get rota by ID
router.get('/:id', rota_controller_1.getRotaById);
// Update rota
router.put('/:id', rota_controller_1.updateRota);
// Delete rota
router.delete('/:id', rota_controller_1.deleteRota);
exports.default = router;
