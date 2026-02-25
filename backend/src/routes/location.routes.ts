import { Router } from 'express';
import { createLocation, getAllLocations, getLocationById, updateLocation, deleteLocation } from '../controllers/location.controller';

const router = Router();

router.post('/', createLocation);
router.get('/', getAllLocations);
router.get('/:id', getLocationById);
router.patch('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export default router;
