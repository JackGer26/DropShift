// src/routes/rota.routes.ts
// Express router for rota endpoints
import { Router } from 'express';
import { createRota, getAllRotas, getRotaById, updateRota, copyPreviousWeek, getStaffRotas, deleteRota } from '../controllers/rota.controller';

const router = Router();

// Create rota
router.post('/', createRota);
// Copy previous week's rota
router.post('/copy-previous-week', copyPreviousWeek);
// Get published rotas for a specific staff member (staff-facing endpoint)
router.get('/staff/:staffId', getStaffRotas);
// Get all rotas
router.get('/', getAllRotas);
// Get rota by ID
router.get('/:id', getRotaById);
// Update rota
router.put('/:id', updateRota);
// Delete rota
router.delete('/:id', deleteRota);

export default router;
