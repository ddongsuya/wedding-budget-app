import { Router } from 'express';
import { exportData, importData } from '../controllers/backupController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/backup/export - 전체 데이터 JSON 내보내기
router.get('/export', authenticate, exportData);

// POST /api/backup/import - JSON 데이터 가져오기
router.post('/import', authenticate, importData);

export default router;
