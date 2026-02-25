import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validation/auth.schemas';

const router = Router();

router.post('/login', validate(loginSchema), login);

export default router;
