import { Router } from 'express';
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff } from '../controllers/staff.controller';
import { validate } from '../middleware/validate';
import { createStaffSchema, updateStaffSchema, staffIdSchema } from '../validation/staff.schemas';

const router = Router();

router.post('/', validate(createStaffSchema), createStaff);
router.get('/', getAllStaff);
router.get('/:id', validate(staffIdSchema), getStaffById);
router.patch('/:id', validate(updateStaffSchema), updateStaff);
router.delete('/:id', validate(staffIdSchema), deleteStaff);

export default router;
