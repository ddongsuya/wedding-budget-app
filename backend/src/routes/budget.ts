import { Router } from 'express';
import {
  getBudgetSettings,
  updateBudgetSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/budgetController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  updateBudgetValidation,
  createCategoryValidation,
  validateIdParam,
  validateOptionalString,
  validatePositiveInt,
} from '../middleware/validation';

const router = Router();

router.get('/', authenticate, getBudgetSettings);

router.put(
  '/',
  authenticate,
  updateBudgetValidation,
  validate,
  updateBudgetSettings
);

router.get('/categories', authenticate, getCategories);

router.post(
  '/categories',
  authenticate,
  createCategoryValidation,
  validate,
  createCategory
);

router.put(
  '/categories/:id',
  authenticate,
  [
    validateIdParam,
    validateOptionalString('name', 100),
    validatePositiveInt('budget_amount'),
    validatePositiveInt('order'),
  ],
  validate,
  updateCategory
);

router.delete('/categories/:id', authenticate, validateIdParam, validate, deleteCategory);

export default router;
