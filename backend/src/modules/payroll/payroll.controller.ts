import { Request, Response, NextFunction } from 'express';
import * as payrollService from './payroll.service';

export async function listSalaryStructures(_req: Request, res: Response, next: NextFunction) {
  try {
    const structures = await payrollService.getSalaryStructures();
    res.status(200).json({
      success: true,
      data: structures,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPayruns(_req: Request, res: Response, next: NextFunction) {
  try {
    const payruns = await payrollService.getPayruns();
    res.status(200).json({
      success: true,
      data: payruns,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayrun(req: Request, res: Response, next: NextFunction) {
  try {
    const payrun = await payrollService.getPayrunById(req.params.id);
    res.status(200).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPayrun(req: Request, res: Response, next: NextFunction) {
  try {
    const payrun = await payrollService.createPayrun(req.body);
    res.status(201).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function generatePayslips(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeIds } = req.body;
    const payrun = await payrollService.generatePayrunPayslips(req.params.id, employeeIds);
    res.status(200).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function computePayrun(req: Request, res: Response, next: NextFunction) {
  try {
    const payrun = await payrollService.computePayrun(req.params.id);
    res.status(200).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function validatePayrun(req: Request, res: Response, next: NextFunction) {
  try {
    const payrun = await payrollService.validatePayrun(req.params.id);
    res.status(200).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaid(req: Request, res: Response, next: NextFunction) {
  try {
    const payrun = await payrollService.markPayrunPaid(req.params.id);
    res.status(200).json({
      success: true,
      data: payrun,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const payslip = await payrollService.getPayslipById(req.params.id);
    res.status(200).json({
      success: true,
      data: payslip,
    });
  } catch (error) {
    next(error);
  }
}
