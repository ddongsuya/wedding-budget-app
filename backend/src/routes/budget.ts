import { Router } from 'express';
import { body } from 'express-validator';
import {
  getBudgetSettings,
  updateBudgetSettings,
  getCategories,
  createCategory,
  updateCategory,
} from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

router.get('/', authenticate, getBudgetSettings);

router.put(
  '/',
  authenticate,
  [
    body('total_budget').optional().isInt({ min: 0 }),
    body('groom_ratio').optional().isInt({ min: 0, max: 100 }),
    body('bride_ratio').optional().isInt({ min: 0, max: 100 }),
    validate,
  ],
  updateBudgetSettings
);

router.get('/categories', authenticate, getCategories);

router.post(
  '/categories',
  authenticate,
  [
    body('name').trim().notEmpty(),
    body('budget_amount').optional().isInt({ min: 0 }),
    body('order').optional().isInt({ min: 0 }),
    validate,
  ],
  createCategory
);

router.put('/categories/:id', authenticate, updateCategory);

export default router;
