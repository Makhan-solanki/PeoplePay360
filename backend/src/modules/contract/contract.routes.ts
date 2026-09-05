import { Router } from 'express';
import * as controller from './contract.controller';
import { validate, authenticate, authorize } from '../../middleware';
import { createContractSchema, updateContractSchema } from './contract.schema';

const router = Router();

router.use(authenticate);

// HR Manager & HR Payroll Manager can manage contracts
router.get('/', controller.listContracts);
router.get('/:id', controller.getContract);

router.post(
  '/',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: createContractSchema }),
  controller.createContract
);

router.put(
  '/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: updateContractSchema }),
  controller.updateContract
);

export default router;
