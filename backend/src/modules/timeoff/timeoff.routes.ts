import { Router } from 'express';
import * as controller from './timeoff.controller';
import { validate, authenticate, authorize } from '../../middleware';
import {
  createTimeOffRequestSchema,
  rejectTimeOffRequestSchema,
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  createAllocationSchema,
} from './timeoff.schema';

const router = Router();

router.use(authenticate);

router.get('/types', controller.listTypes);

router.post(
  '/types',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: createTimeOffTypeSchema }),
  controller.createType
);

router.put(
  '/types/:id',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: updateTimeOffTypeSchema }),
  controller.updateType
);

router.get('/allocations', controller.getMyAllocations);

router.post(
  '/allocations',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: createAllocationSchema }),
  controller.createAllocation
);

router.get('/requests', controller.listRequests);
router.post('/requests', validate({ body: createTimeOffRequestSchema }), controller.submitRequest);

// Approvals restricted to HR Manager & HR Payroll Manager
router.patch(
  '/requests/:id/approve',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  controller.approveRequest
);

router.patch(
  '/requests/:id/reject',
  authorize(['HR_MANAGER', 'HR_PAYROLL_MANAGER']),
  validate({ body: rejectTimeOffRequestSchema }),
  controller.rejectRequest
);

export default router;
