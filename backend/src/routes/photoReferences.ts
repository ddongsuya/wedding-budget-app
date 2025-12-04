import { Router } from 'express';
import {
  getPhotoReferences,
  createPhotoReference,
  updatePhotoReference,
  deletePhotoReference,
  toggleFavorite,
} from '../controllers/photoReferenceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getPhotoReferences);
router.post('/', authenticate, createPhotoReference);
router.put('/:id', authenticate, updatePhotoReference);
router.delete('/:id', authenticate, deletePhotoReference);
router.patch('/:id/favorite', authenticate, toggleFavorite);

export default router;
