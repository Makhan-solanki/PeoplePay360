import { Router } from 'express';
import * as controller from './attendance.controller';
import { validate, authenticate, authorize } from '../../middleware';
import { checkInSchema, checkOutSchema, updateAttendanceSchema } from './attendance.schema';

const router = Router();

router.use(authenticate);

router.post('/check-in', validate({ body: checkInSchema }), controller.checkIn);
router.post('/check-out', validate({ body: checkOutSchema }), controller.checkOut);
router.get('/', controller.listAttendances);
router.get('/today/:employeeId', controller.getToday);
router.get('/:id', controller.getAttendance);

router.put(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: updateAttendanceSchema }),
  controller.updateAttendance
);

export default router;
