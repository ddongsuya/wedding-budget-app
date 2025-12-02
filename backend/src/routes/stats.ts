import { Router } from 'express';
import {
  getSummary,
  getByCategory,
  getByMonth,
  getByPayer,
} from '../controllers/statsController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/summary', authenticate, getSummary);
router.get('/by-category', authenticate, getByCategory);
router.get('/by-month', authenticate, getByMonth);
router.get('/by-payer', authenticate, getByPayer);

export default router;
