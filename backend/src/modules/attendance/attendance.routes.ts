import { Router } from 'express';
import * as controller from './attendance.controller';
import { validate, authenticate } from '../../middleware';
import { checkInSchema, checkOutSchema } from './attendance.schema';

const router = Router();

router.use(authenticate);

router.post('/check-in', validate({ body: checkInSchema }), controller.checkIn);
router.post('/check-out', validate({ body: checkOutSchema }), controller.checkOut);
router.get('/', controller.listAttendances);
router.get('/today/:employeeId', controller.getToday);

export default router;
