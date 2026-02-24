import { Router } from 'express';
import { createStaff, getAllStaff, getStaffById, updateStaff, deleteStaff } from '../controllers/staff.controller';

const router = Router();

router.post('/', createStaff);
router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.patch('/:id', updateStaff);
router.delete('/:id', deleteStaff);

export default router;
