import { Request, Response, NextFunction } from 'express';
import * as workingScheduleService from './working-schedule.service';

export async function listWorkingSchedules(_req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await workingScheduleService.getAllWorkingSchedules();
    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    next(error);
  }
}

export async function getWorkingSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await workingScheduleService.getWorkingScheduleById(req.params.id);
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
}

export async function createWorkingSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await workingScheduleService.createWorkingSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkingSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedule = await workingScheduleService.updateWorkingSchedule(req.params.id, req.body);
    res.status(200).json({ success: true, data: schedule });
  } catch (error) {
    next(error);
  }
}
