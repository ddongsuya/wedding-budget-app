import { Router } from 'express';
import {
  getVenueContract,
  upsertVenueContract,
  deleteVenueContract,
  upsertContractExpense,
  getContractedVenues,
} from '../controllers/venueContractController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 계약된 식장 목록 (대시보드용)
router.get('/contracted', authenticate, getContractedVenues);

// 특정 식장의 계약 정보
router.get('/:venueId', authenticate, getVenueContract);
router.post('/:venueId', authenticate, upsertVenueContract);
router.delete('/:venueId', authenticate, deleteVenueContract);

// 계약 지출 항목
router.post('/:venueId/expenses', authenticate, upsertContractExpense);

export default router;
