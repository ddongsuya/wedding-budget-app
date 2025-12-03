import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as coupleController from '../controllers/coupleController';

const router = Router();

router.use(authenticate);

// 커플 정보 조회
router.get('/', coupleController.getCoupleInfo);

// 커플 생성 (초대 코드 발급)
router.post('/create', coupleController.createCouple);

// 초대 코드로 커플 연결
router.post('/join', coupleController.joinCouple);

// 초대 코드 재생성
router.post('/regenerate-code', coupleController.regenerateInviteCode);

// 커플 연결 해제
router.post('/leave', coupleController.leaveCouple);

// 파트너 정보 조회
router.get('/partner', coupleController.getPartnerInfo);

export default router;
