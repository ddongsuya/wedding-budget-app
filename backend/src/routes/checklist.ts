import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createChecklistCategoryValidation,
  createChecklistItemValidation,
  updateChecklistItemValidation,
  validateIdParam,
  validateArray,
} from '../middleware/validation';
import * as checklistController from '../controllers/checklistController';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 카테고리
router.get('/categories', checklistController.getCategories);
router.post('/categories', createChecklistCategoryValidation, validate, checklistController.createCategory);
router.put(
  '/categories/:id',
  [
    validateIdParam,
    body('name').optional().trim().isLength({ max: 100 }),
    body('order').optional().isInt({ min: 0 }),
    body('color').optional().trim().isLength({ max: 20 }),
  ],
  validate,
  checklistController.updateCategory
);
router.delete('/categories/:id', validateIdParam, validate, checklistController.deleteCategory);
router.put(
  '/categories/reorder',
  [body('categoryIds').isArray().withMessage('categoryIds는 배열이어야 합니다')],
  validate,
  checklistController.reorderCategories
);

// 아이템
router.get('/items', checklistController.getItems);
router.get('/items/:id', validateIdParam, validate, checklistController.getItem);
router.post('/items', createChecklistItemValidation, validate, checklistController.createItem);
router.put('/items/:id', updateChecklistItemValidation, validate, checklistController.updateItem);
router.delete('/items/:id', validateIdParam, validate, checklistController.deleteItem);
router.put(
  '/items/reorder',
  [body('itemIds').isArray().withMessage('itemIds는 배열이어야 합니다')],
  validate,
  checklistController.reorderItems
);

// 완료 토글
router.patch('/items/:id/toggle', validateIdParam, validate, checklistController.toggleComplete);

// 일괄 작업
router.post(
  '/items/bulk-complete',
  [body('itemIds').isArray().withMessage('itemIds는 배열이어야 합니다')],
  validate,
  checklistController.bulkComplete
);
router.delete(
  '/items/bulk-delete',
  [body('itemIds').isArray().withMessage('itemIds는 배열이어야 합니다')],
  validate,
  checklistController.bulkDelete
);

// 통계
router.get('/stats', checklistController.getStats);

// 기본 템플릿 불러오기
router.post('/init-defaults', checklistController.initDefaultItems);

export default router;
