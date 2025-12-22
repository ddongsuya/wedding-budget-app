import { Router } from 'express';
import {
  getVenues,
  createVenue,
  getVenue,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createVenueValidation,
  updateVenueValidation,
  validateIdParam,
} from '../middleware/validation';

const router = Router();

router.get('/', authenticate, getVenues);

router.post(
  '/',
  authenticate,
  createVenueValidation,
  validate,
  createVenue
);

router.get('/:id', authenticate, validateIdParam, validate, getVenue);

router.put('/:id', authenticate, updateVenueValidation, validate, updateVenue);

router.delete('/:id', authenticate, validateIdParam, validate, deleteVenue);

export default router;
