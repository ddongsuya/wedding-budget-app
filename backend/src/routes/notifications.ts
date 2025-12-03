import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getPreferences,
  updatePreferences,
} from '../controllers/notificationController';

const router = Router();

// 모든 라우트에 인증 필요
router.use(authenticateToken);

// 알림 목록 조회
router.get('/', getNotifications);

// 안읽은 알림 개수 조회
router.get('/unread-count', getUnreadCount);

// 알림 설정 조회
router.get('/preferences', getPreferences);

// 알림 설정 업데이트
router.put('/preferences', updatePreferences);

// 모든 알림 읽음 처리
router.put('/read-all', markAllAsRead);

// 특정 알림 읽음 처리
router.put('/:id/read', markAsRead);

// 특정 알림 삭제
router.delete('/:id', deleteNotification);

// 모든 알림 삭제
router.delete('/', clearAllNotifications);

export default router;
