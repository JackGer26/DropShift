import { Router } from 'express';

import staffRoutes from './staff.routes';
import templateRoutes from './template.routes';
import rotaRoutes from "./rota.routes";
import locationRoutes from './location.routes';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'API test successful' });
});

router.use('/staff', staffRoutes);
router.use('/templates', templateRoutes);
router.use("/rotas", rotaRoutes);
router.use('/locations', locationRoutes);

export default router;
