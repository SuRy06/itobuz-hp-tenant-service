import { Request, Response, NextFunction } from "express";
import { injectable } from "tsyringe";
import {
  permissionOverrideSchema,
  suspendTenantMemberSchema,
  updateMembershipRolesSchema,
} from "../validation/tenant-membership.validator";
import { HttpError } from "../../common/errors/http.error";
import { TenantMembershipService } from "../services/tenant-membership.service";

@injectable()
export class TenantMembershipController {
  constructor(private readonly tenantMembershipService: TenantMembershipService) {}
  public updateTenantMembershipRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = updateMembershipRolesSchema.validate(req.body);
      if (error) {
        throw new HttpError(400, error.details[0].message);
      }
      const { tenantId, userId } = req.params;
      const { add = [], remove = [] } = req.body;

      const result = await this.tenantMembershipService.updateMembershipRoles(tenantId, userId, add, remove);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public allowPermissionOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = permissionOverrideSchema.validate(req.body);
      if (error) throw new HttpError(400, error.details[0].message);

      const { tenantId, userId } = req.params;
      const { permissionId, reason } = req.body;

      const result = await this.tenantMembershipService.setOverride(tenantId, userId, permissionId, "ALLOW", reason);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public denyPermissionOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = permissionOverrideSchema.validate(req.body);
      if (error) throw new HttpError(400, error.details[0].message);

      const { tenantId, userId } = req.params;
      const { permissionId, reason } = req.body;

      const result = await this.tenantMembershipService.setOverride(tenantId, userId, permissionId, "DENY", reason);

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  public removePermissionOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId, permissionId } = req.params;

      const result = await this.tenantMembershipService.removeOverride(tenantId, userId, permissionId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public suspendTenantMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = suspendTenantMemberSchema.validate(req.body);
      if (error) throw new HttpError(400, error.details[0].message);

      const { tenantId, userId } = req.params;

      const result = await this.tenantMembershipService.suspendMembership(tenantId, userId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  public unsuspendTenantMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId, userId } = req.params;

      const result = await this.tenantMembershipService.unsuspendMembership(tenantId, userId);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}
