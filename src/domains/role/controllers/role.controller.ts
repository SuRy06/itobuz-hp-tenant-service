import { Request, Response, NextFunction } from "express";
import { injectable } from "tsyringe";
import { createRoleSchema, updateRolePermissionsSchema } from "../validation/role.validation";
import { HttpError } from "../../common/errors/http.error";
import { RoleService } from "../services/role.service";

@injectable()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  public createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = createRoleSchema.validate(req.body);
      if (error) {
        throw new HttpError(400, error.details[0].message);
      }
      const { name } = req.body;

      const { tenantId } = req.params;

      if (!tenantId) {
        throw new HttpError(400, "tenant id is required");
      }

      const result = await this.roleService.createRole(name, tenantId);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  public updateRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = updateRolePermissionsSchema.validate(req.body);
      if (error) {
        throw new HttpError(400, error.details[0].message);
      }

      const { tenantId, roleId } = req.params;
      const { add = [], remove = [] } = req.body;

      const result = await this.roleService.updateRolePermissions(tenantId, roleId, add, remove);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public listRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        throw new HttpError(400, "tenant id is required");
      }

      const limit = Math.min(Number(req.query.limit) || 50, 100);
      const cursor = req.query.cursor as string | undefined;

      const result = await this.roleService.listRoles(tenantId, limit, cursor);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
