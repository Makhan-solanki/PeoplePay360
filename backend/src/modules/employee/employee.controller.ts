import { Request, Response, NextFunction } from 'express';
import * as employeeService from './employee.service';

export async function listEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const { department, status, search } = req.query as {
      department?: string;
      status?: string;
      search?: string;
    };
    const employees = await employeeService.getAllEmployees({ department, status, search });
    res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
}
