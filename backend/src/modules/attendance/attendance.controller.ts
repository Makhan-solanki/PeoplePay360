import { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service';
import { ForbiddenError } from '../../lib/errors';

/**
 * Employees may only check themselves in/out and view their own attendance —
 * checking in/out on behalf of someone else, or browsing another employee's
 * records, is an HR Manager / HR Payroll Manager action.
 */
async function assertSelfOrPrivileged(req: Request, employeeId: string, message: string): Promise<void> {
  if (req.user!.role !== 'EMPLOYEE') return;
  const ownEmployeeId = await attendanceService.getOwnEmployeeId(req.user!.id);
  if (!ownEmployeeId || ownEmployeeId !== employeeId) {
    throw new ForbiddenError(message);
  }
}

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    await assertSelfOrPrivileged(req, req.body.employeeId, 'You can only check yourself in');
    const attendance = await attendanceService.checkIn(req.body);
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    await assertSelfOrPrivileged(req, req.body.employeeId, 'You can only check yourself out');
    const attendance = await attendanceService.checkOut(req.body);
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAttendances(req: Request, res: Response, next: NextFunction) {
  try {
    let { employeeId, startDate, endDate } = req.query as {
      employeeId?: string;
      startDate?: string;
      endDate?: string;
    };

    if (req.user!.role === 'EMPLOYEE') {
      employeeId = (await attendanceService.getOwnEmployeeId(req.user!.id)) ?? '__none__';
    }

    const attendances = await attendanceService.getAttendances({ employeeId, startDate, endDate });
    res.status(200).json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    next(error);
  }
}

export async function getToday(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    await assertSelfOrPrivileged(req, employeeId, 'You can only view your own attendance');
    const attendance = await attendanceService.getTodayAttendance(employeeId);
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.id);
    await assertSelfOrPrivileged(req, attendance.employeeId, 'You can only view your own attendance records');
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const attendance = await attendanceService.updateAttendance(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}
