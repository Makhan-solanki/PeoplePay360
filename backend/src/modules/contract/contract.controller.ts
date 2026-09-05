import { Request, Response, NextFunction } from 'express';
import * as contractService from './contract.service';

export async function listContracts(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.query as { employeeId?: string };
    const contracts = employeeId
      ? await contractService.getContractsByEmployee(employeeId)
      : await contractService.getAllContracts();
    res.status(200).json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    next(error);
  }
}

export async function getContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractService.getContractById(req.params.id);
    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
}

export async function createContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractService.createContract(req.body);
    res.status(201).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContract(req: Request, res: Response, next: NextFunction) {
  try {
    const contract = await contractService.updateContract(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    next(error);
  }
}
