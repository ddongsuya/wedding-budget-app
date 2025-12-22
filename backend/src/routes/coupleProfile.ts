import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadGroomImage,
  uploadBrideImage,
  uploadCoupleImage,
} from '../controllers/coupleProfileController';
import { authenticate } from '../middleware/auth';
import { validate, updateCoupleProfileValidation } from '../middleware/validation';
import { upload } from '../utils/upload';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateCoupleProfileValidation, validate, updateProfile);
router.post('/profile/groom-image', authenticate, upload.single('image'), uploadGroomImage);
router.post('/profile/bride-image', authenticate, upload.single('image'), uploadBrideImage);
router.post('/profile/couple-image', authenticate, upload.single('image'), uploadCoupleImage);

export default router;
