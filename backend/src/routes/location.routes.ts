import { Router } from 'express';
import { createLocation, getAllLocations, getLocationById, updateLocation, deleteLocation } from '../controllers/location.controller';
import { validate } from '../middleware/validate';
import { createLocationSchema, updateLocationSchema, locationIdSchema } from '../validation/location.schemas';

const router = Router();

router.post('/', validate(createLocationSchema), createLocation);
router.get('/', getAllLocations);
router.get('/:id', validate(locationIdSchema), getLocationById);
router.patch('/:id', validate(updateLocationSchema), updateLocation);
router.delete('/:id', validate(locationIdSchema), deleteLocation);

export default router;
