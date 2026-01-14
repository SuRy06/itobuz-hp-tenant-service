import { Request, Response, NextFunction } from "express";
import { injectable } from "tsyringe";
import { TenantService } from "../services/tenant.service";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  createTenant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId } = req.params;
      const { name } = req.body;

      if (!orgId) {
        throw new HttpError(400, "Organization ID is required");
      }

      // Create tenant
      const tenant = await this.tenantService.createTenant({
        orgId,
        name: name.trim(),
      });

      res.status(201).json({
        tenantId: tenant.tenantId,
        orgId: tenant.orgId,
        name: tenant.name,
        status: tenant.status,
        createdAt: tenant.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateTenant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const { reason } = req.body;

      if (!tenantId) {
        throw new HttpError(400, "Tenant ID is required");
      }

      // Deactivate tenant
      const tenant = await this.tenantService.deactivateTenant(tenantId, {
        reason,
      });

      res.status(200).json({
        tenantId: tenant.tenantId,
        status: tenant.status,
        deactivatedAt: tenant.deactivatedAt,
      });
    } catch (error) {
      next(error);
    }
  };

  getTenant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        throw new HttpError(400, "Tenant ID is required");
      }

      // Get tenant details
      const tenant = await this.tenantService.getTenant(tenantId);

      res.status(200).json({
        tenantId: tenant.tenantId,
        orgId: tenant.orgId,
        name: tenant.name,
        status: tenant.status,
        createdAt: tenant.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  addUserToTenant = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const { userId } = req.body;

      if (!tenantId) {
        throw new HttpError(400, "Tenant ID is required");
      }

      if (!userId) {
        throw new HttpError(400, "User ID is required");
      }

      // Add user to tenant
      const membership = await this.tenantService.addUserToTenant(tenantId, {
        userId,
      });

      res.status(201).json({
        tenantId: membership.tenantId,
        userId: membership.userId,
        status: membership.status,
        createdAt: membership.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };
}
