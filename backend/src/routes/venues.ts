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
    body('name').trim().notEmpty().withMessage('식장 이름은 필수입니다'),
    body('type').optional().trim(),
    body('price').optional().isInt({ min: 0 }).withMessage('가격은 0 이상이어야 합니다'),
    body('capacity').optional().isInt({ min: 0 }).withMessage('수용인원은 0 이상이어야 합니다'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('별점은 0-5 사이여야 합니다'),
    validate,
  ],
  createVenue
);

router.get('/:id', authenticate, getVenue);

router.put('/:id', authenticate, updateVenue);

router.delete('/:id', authenticate, deleteVenue);

export default router;
