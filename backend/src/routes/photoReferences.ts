import { Router } from 'express';
import {
  getPhotoReferences,
  createPhotoReference,
  updatePhotoReference,
  deletePhotoReference,
  toggleFavorite,
} from '../controllers/photoReferenceController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createPhotoReferenceValidation,
  updatePhotoReferenceValidation,
  validateIdParam,
} from '../middleware/validation';

const router = Router();

router.get('/', authenticate, getPhotoReferences);
router.post('/', authenticate, createPhotoReferenceValidation, validate, createPhotoReference);
router.put('/:id', authenticate, updatePhotoReferenceValidation, validate, updatePhotoReference);
router.delete('/:id', authenticate, validateIdParam, validate, deletePhotoReference);
router.patch('/:id/favorite', authenticate, validateIdParam, validate, toggleFavorite);

export default router;
