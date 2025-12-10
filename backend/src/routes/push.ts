import { Router, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  savePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
} from '../services/pushService';

const router = Router();

// VAPID 공개 키 가져오기 (인증 불필요)
router.get('/vapid-public-key', (req, res) => {
  const publicKey = getVapidPublicKey();
  
  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: '푸시 알림 서비스가 설정되지 않았습니다',
      data: { publicKey: null },
    });
  }
  
  res.json({
    success: true,
    data: { publicKey },
  });
});

// 푸시 구독 등록
router.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '인증이 필요합니다' });
    }

    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: '유효하지 않은 구독 정보입니다' });
    }

    const userAgent = req.headers['user-agent'];
    await savePushSubscription(String(userId), subscription, userAgent);

    res.json({
      success: true,
      message: '푸시 알림이 등록되었습니다',
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, message: '푸시 알림 등록에 실패했습니다' });
  }
});

// 푸시 구독 해제
router.delete('/unsubscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '인증이 필요합니다' });
    }

    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'endpoint가 필요합니다' });
    }

    await removePushSubscription(String(userId), endpoint);

    res.json({
      success: true,
      message: '푸시 알림이 해제되었습니다',
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, message: '푸시 알림 해제에 실패했습니다' });
  }
});

export default router;
