import { Request, Response, NextFunction } from 'express';
import * as timeOffService from './timeoff.service';

export async function listTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const types = await timeOffService.getTimeOffTypes();
    res.status(200).json({
      success: true,
      data: types,
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyAllocations(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, year } = req.query as { employeeId: string; year?: string };
    if (!employeeId) {
      res.status(400).json({ success: false, error: 'employeeId query parameter is required' });
      return;
    }
    const allocations = await timeOffService.getEmployeeAllocations(
      employeeId,
      year ? parseInt(year, 10) : undefined
    );
    res.status(200).json({
      success: true,
      data: allocations,
    });
  } catch (error) {
    next(error);
  }
}

export async function listRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, status } = req.query as { employeeId?: string; status?: string };
    const requests = await timeOffService.getTimeOffRequests({ employeeId, status });
    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
}

export async function submitRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await timeOffService.submitTimeOffRequest(req.body);
    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function approveRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await timeOffService.approveTimeOffRequest(req.params.id, req.user!.id);
    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function rejectRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const request = await timeOffService.rejectTimeOffRequest(req.params.id, req.user!.id, req.body);
    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

export async function createType(req: Request, res: Response, next: NextFunction) {
  try {
    const type = await timeOffService.createTimeOffType(req.body);
    res.status(201).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
}

export async function updateType(req: Request, res: Response, next: NextFunction) {
  try {
    const type = await timeOffService.updateTimeOffType(req.params.id, req.body);
    res.status(200).json({ success: true, data: type });
  } catch (error) {
    next(error);
  }
}

export async function createAllocation(req: Request, res: Response, next: NextFunction) {
  try {
    const allocation = await timeOffService.createAllocation(req.body);
    res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    next(error);
  }
}
