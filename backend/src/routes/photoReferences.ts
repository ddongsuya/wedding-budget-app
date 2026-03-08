import { Router } from 'express';
import {
  getPhotoReferences,
  createPhotoReference,
  updatePhotoReference,
  deletePhotoReference,
  toggleFavorite,
  reorderPhotoReferences,
} from '../controllers/photoReferenceController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createPhotoReferenceValidation,
  updatePhotoReferenceValidation,
  validateIdParam,
} from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

router.get('/', authenticate, getPhotoReferences);
router.post('/', authenticate, createPhotoReferenceValidation, validate, createPhotoReference);
router.patch(
  '/reorder',
  authenticate,
  [body('orders').isArray({ min: 1 }).withMessage('orders는 비어있지 않은 배열이어야 합니다')],
  validate,
  reorderPhotoReferences
);
router.put('/:id', authenticate, updatePhotoReferenceValidation, validate, updatePhotoReference);
router.delete('/:id', authenticate, validateIdParam, validate, deletePhotoReference);
router.patch('/:id/favorite', authenticate, validateIdParam, validate, toggleFavorite);

export default router;
