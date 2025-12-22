import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import {
  validate,
  createEventValidation,
  updateEventValidation,
  validateIdParam,
} from '../middleware/validation';
import * as eventController from '../controllers/eventController';

const router = Router();

router.use(authenticate);

// CRUD
router.get('/', eventController.getEvents);
router.get('/upcoming', eventController.getUpcomingEvents); // 이 라우트를 먼저 배치
router.get(
  '/month/:year/:month',
  [
    param('year').isInt({ min: 2000, max: 2100 }).withMessage('유효한 연도를 입력해주세요'),
    param('month').isInt({ min: 1, max: 12 }).withMessage('유효한 월을 입력해주세요'),
  ],
  validate,
  eventController.getEventsByMonth
);
router.get(
  '/category/:category',
  [
    param('category')
      .isIn(['venue', 'dress', 'photo', 'honeymoon', 'etc'])
      .withMessage('유효한 카테고리를 입력해주세요'),
  ],
  validate,
  eventController.getEventsByCategory
);
router.get('/:id', validateIdParam, validate, eventController.getEvent);
router.post('/', createEventValidation, validate, eventController.createEvent);
router.put('/:id', updateEventValidation, validate, eventController.updateEvent);
router.delete('/:id', validateIdParam, validate, eventController.deleteEvent);

export default router;
