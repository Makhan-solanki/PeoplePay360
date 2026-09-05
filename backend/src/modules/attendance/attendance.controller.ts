import { Request, Response, NextFunction } from 'express';
import * as attendanceService from './attendance.service';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
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
    const { employeeId, startDate, endDate } = req.query as {
      employeeId?: string;
      startDate?: string;
      endDate?: string;
    };
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
    const attendance = await attendanceService.getTodayAttendance(employeeId);
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    next(error);
  }
}
