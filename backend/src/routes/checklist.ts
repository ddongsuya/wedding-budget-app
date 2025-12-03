import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as checklistController from '../controllers/checklistController';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticate);

// 카테고리
router.get('/categories', checklistController.getCategories);
router.post('/categories', checklistController.createCategory);
router.put('/categories/:id', checklistController.updateCategory);
router.delete('/categories/:id', checklistController.deleteCategory);
router.put('/categories/reorder', checklistController.reorderCategories);

// 아이템
router.get('/items', checklistController.getItems);
router.get('/items/:id', checklistController.getItem);
router.post('/items', checklistController.createItem);
router.put('/items/:id', checklistController.updateItem);
router.delete('/items/:id', checklistController.deleteItem);
router.put('/items/reorder', checklistController.reorderItems);

// 완료 토글
router.patch('/items/:id/toggle', checklistController.toggleComplete);

// 일괄 작업
router.post('/items/bulk-complete', checklistController.bulkComplete);
router.delete('/items/bulk-delete', checklistController.bulkDelete);

// 통계
router.get('/stats', checklistController.getStats);

// 기본 템플릿 불러오기
router.post('/init-defaults', checklistController.initDefaultItems);

export default router;
