import { Router } from 'express';
import * as controller from './employee.controller';
import { validate, authenticate, authorize } from '../../middleware';
import { createEmployeeSchema, updateEmployeeSchema } from './employee.schema';

const router = Router();

router.use(authenticate);

// All authenticated users can view the employee directory
router.get('/', controller.listEmployees);
router.get('/:id', controller.getEmployee);

// HR Manager & HR Payroll Manager can manage employees
router.post(
  '/',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: createEmployeeSchema }),
  controller.createEmployee
);

router.put(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: updateEmployeeSchema }),
  controller.updateEmployee
);

export default router;
