import { Router } from 'express';

import staffRoutes from './staff.routes';
import templateRoutes from './template.routes';
import rotaRoutes from "./rota.routes";

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'API test successful' });
});

router.use('/staff', staffRoutes);
router.use('/templates', templateRoutes);
router.use("/rotas", rotaRoutes);

export default router;
