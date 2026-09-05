import { Router } from 'express';
import * as controller from './payroll.controller';
import { validate, authenticate, authorize } from '../../middleware';
import {
  createPayrunSchema,
  generatePayslipsSchema,
  salaryStructureSchema,
  updateSalaryStructureSchema,
  salaryRuleSchema,
  updateSalaryRuleSchema,
} from './payroll.schema';

const router = Router();

router.use(authenticate);

// Salary structures (viewable by authenticated users)
router.get('/structures', controller.listSalaryStructures);

router.post(
  '/structures',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: salaryStructureSchema }),
  controller.createSalaryStructure
);

router.put(
  '/structures/:id',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: updateSalaryStructureSchema }),
  controller.updateSalaryStructure
);

router.post(
  '/structures/:structureId/rules',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: salaryRuleSchema }),
  controller.createSalaryRule
);

router.put(
  '/rules/:id',
  authorize(['HR_PAYROLL_MANAGER']),
  validate({ body: updateSalaryRuleSchema }),
  controller.updateSalaryRule
);

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

router.post(
  '/payslips/:id/compute',
  authorize(['HR_PAYROLL_MANAGER']),
  controller.computePayslip
);

router.post(
  '/payslips/:id/pay',
  authorize(['HR_PAYROLL_MANAGER']),
  controller.payPayslip
);

export default router;
