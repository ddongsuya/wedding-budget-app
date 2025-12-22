import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
} from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createExpenseValidation,
  updateExpenseValidation,
  validateIdParam,
} from '../middleware/validation';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', authenticate, getExpenses);

router.post(
  '/',
  authenticate,
  createExpenseValidation,
  validate,
  createExpense
);

router.get('/:id', authenticate, validateIdParam, validate, getExpense);

router.put('/:id', authenticate, updateExpenseValidation, validate, updateExpense);

router.delete('/:id', authenticate, validateIdParam, validate, deleteExpense);

router.post('/:id/receipt', authenticate, validateIdParam, validate, upload.single('receipt'), uploadReceipt);

export default router;
