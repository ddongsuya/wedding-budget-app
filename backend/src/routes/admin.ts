import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createAnnouncementValidation,
  updateAnnouncementValidation,
  validateIdParam,
} from '../middleware/validation';
import * as adminController from '../controllers/adminController';

const router = Router();

// 모든 관리자 라우트에 인증 필요
router.use(authenticate);

// 활성 공지사항 조회 (일반 사용자도 접근 가능)
router.get('/announcements/active', adminController.getActiveAnnouncements);

// 관리자 권한 필요한 라우트들
router.use(adminController.checkAdminPermission);

// 대시보드 통계
router.get('/dashboard/stats', adminController.getDashboardStats);

// 사용자 관리
router.get('/users', adminController.getUsers);
router.put(
  '/users/:userId/admin',
  [param('userId').isInt({ min: 1 }).withMessage('유효한 사용자 ID를 입력해주세요')],
  validate,
  adminController.toggleUserAdmin
);

// 공지사항 관리
router.get('/announcements', adminController.getAnnouncements);
router.post('/announcements', createAnnouncementValidation, validate, adminController.createAnnouncement);
router.put('/announcements/:id', updateAnnouncementValidation, validate, adminController.updateAnnouncement);
router.delete('/announcements/:id', validateIdParam, validate, adminController.deleteAnnouncement);

export default router;
