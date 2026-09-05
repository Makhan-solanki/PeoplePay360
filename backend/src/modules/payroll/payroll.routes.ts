import { Router } from 'express';
import * as controller from './payroll.controller';
import { validate, authenticate, authorize } from '../../middleware';
import { createPayrunSchema, generatePayslipsSchema } from './payroll.schema';

const router = Router();

router.use(authenticate);

// Salary structures (viewable by authenticated users)
router.get('/structures', controller.listSalaryStructures);

// Payruns & Payslips management restricted to HR Payroll Manager
router.get('/payruns', controller.listPayruns);
router.get('/payruns/:id', controller.getPayrun);
router.get('/payslips/:id', controller.getPayslip);

router.post(
  '/payruns',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: createPayrunSchema }),
  controller.createPayrun
);

router.post(
  '/payruns/:id/generate',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: generatePayslipsSchema }),
  controller.generatePayslips
);

router.post(
  '/payruns/:id/compute',
  authorize(['HR_PAYROLL_MANAGER']),
  controller.computePayrun
);

router.post(
  '/payruns/:id/validate',
  authorize(['HR_PAYROLL_MANAGER']),
  controller.validatePayrun
);

router.post(
  '/payruns/:id/pay',
  authorize(['HR_PAYROLL_MANAGER']),
  controller.markPaid
);

export default router;
