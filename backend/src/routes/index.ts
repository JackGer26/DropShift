import { Router } from 'express';

import authRoutes from './auth.routes';
import staffRoutes from './staff.routes';
import templateRoutes from './template.routes';
import rotaRoutes from './rota.routes';
import locationRoutes from './location.routes';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// Staff-facing: public (no admin login required for staff to see their schedule)
import { getStaffRotas } from '../controllers/rota.controller';
import { getAllLocations } from '../controllers/location.controller';
router.get('/rotas/staff/:staffId', getStaffRotas);
router.get('/locations', getAllLocations);

// ─── Protected admin routes ───────────────────────────────────────────────────
router.use(authenticate);

router.use('/staff', staffRoutes);
router.use('/templates', templateRoutes);
router.use('/rotas', rotaRoutes);
router.use('/locations', locationRoutes);

export default router;
