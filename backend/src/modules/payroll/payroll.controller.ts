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

export async function computePayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const payslip = await payrollService.computeSinglePayslip(req.params.id);
    res.status(200).json({ success: true, data: payslip });
  } catch (error) {
    next(error);
  }
}

export async function payPayslip(req: Request, res: Response, next: NextFunction) {
  try {
    const payslip = await payrollService.markSinglePayslipPaid(req.params.id);
    res.status(200).json({ success: true, data: payslip });
  } catch (error) {
    next(error);
  }
}

export async function createSalaryStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const structure = await payrollService.createSalaryStructure(req.body);
    res.status(201).json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
}

export async function updateSalaryStructure(req: Request, res: Response, next: NextFunction) {
  try {
    const structure = await payrollService.updateSalaryStructure(req.params.id, req.body);
    res.status(200).json({ success: true, data: structure });
  } catch (error) {
    next(error);
  }
}

export async function createSalaryRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await payrollService.createSalaryRule(req.params.structureId, req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}

export async function updateSalaryRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await payrollService.updateSalaryRule(req.params.id, req.body);
    res.status(200).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
}
