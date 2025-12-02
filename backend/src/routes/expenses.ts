import { Router } from 'express';
import { body } from 'express-validator';
import {
  getExpenses,
  createExpense,
  getExpense,
  updateExpense,
  deleteExpense,
  uploadReceipt,
} from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { upload } from '../utils/upload';

const router = Router();

router.get('/', authenticate, getExpenses);

router.post(
  '/',
  authenticate,
  [
    body('title').trim().notEmpty(),
    body('amount').isInt({ min: 0 }),
    body('date').isISO8601(),
    body('payer').isIn(['groom', 'bride']),
    body('category_id').optional().isInt(),
    validate,
  ],
  createExpense
);

router.get('/:id', authenticate, getExpense);

router.put('/:id', authenticate, updateExpense);

router.delete('/:id', authenticate, deleteExpense);

router.post('/:id/receipt', authenticate, upload.single('receipt'), uploadReceipt);

export default router;
