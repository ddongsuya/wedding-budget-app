import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as eventController from '../controllers/eventController';

const router = Router();

router.use(authenticate);

// CRUD
router.get('/', eventController.getEvents);
router.get('/upcoming', eventController.getUpcomingEvents); // 이 라우트를 먼저 배치
router.get('/month/:year/:month', eventController.getEventsByMonth);
router.get('/category/:category', eventController.getEventsByCategory);
router.get('/:id', eventController.getEvent);
router.post('/', eventController.createEvent);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

export default router;
