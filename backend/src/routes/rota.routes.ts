// src/routes/rota.routes.ts
// Express router for rota endpoints
import { Router } from 'express';
import { createRota, getAllRotas, getRotaById, updateRota } from '../controllers/rota.controller';

const router = Router();

// Create rota
router.post('/', createRota);
// Get all rotas
router.get('/', getAllRotas);
// Get rota by ID
router.get('/:id', getRotaById);
// Update rota
router.put('/:id', updateRota);

export default router;
