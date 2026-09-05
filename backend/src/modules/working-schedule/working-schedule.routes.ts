import { Router } from 'express';
import * as controller from './working-schedule.controller';
import { validate, authenticate, authorize } from '../../middleware';
import { createWorkingScheduleSchema, updateWorkingScheduleSchema } from './working-schedule.schema';

const router = Router();

router.use(authenticate);

router.get('/', controller.listWorkingSchedules);
router.get('/:id', controller.getWorkingSchedule);

router.post(
  '/',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: createWorkingScheduleSchema }),
  controller.createWorkingSchedule
);

router.put(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: updateWorkingScheduleSchema }),
  controller.updateWorkingSchedule
);

export default router;
