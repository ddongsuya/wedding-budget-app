import { Router } from 'express';
import { body } from 'express-validator';
import {
  getVenues,
  createVenue,
  getVenue,
  updateVenue,
  deleteVenue,
} from '../controllers/venueController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.get('/', authenticate, getVenues);

router.post(
  '/',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('type').optional().trim(),
    body('price').optional().isInt({ min: 0 }),
    body('capacity').optional().isInt({ min: 0 }),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    validate,
  ],
  createVenue
);

router.get('/:id', authenticate, getVenue);

router.put('/:id', authenticate, updateVenue);

router.delete('/:id', authenticate, deleteVenue);

export default router;
