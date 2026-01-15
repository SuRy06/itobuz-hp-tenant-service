import { injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { createPermissionSchema, listPermissionSchema } from "../validation/permission.validation";
import { HttpError } from "../../common/errors/http.error";
import { PermissionService } from "../services/permission.service";

@injectable()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}
  public listPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error, value } = listPermissionSchema.validate(req.query);
      if (error) {
        throw new HttpError(400, error.details[0].message);
      }

      const status = value.status as "ACTIVE" | "DEPRECATED" | undefined;

      const { data, page } = await this.permissionService.listPermission(
        status,
        value.query,
        value.limit,
        value.cursor
      );

      res.status(200).json({ data, page });
    } catch (error) {
      next(error);
    }
  };

  public createPermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { error } = createPermissionSchema.validate(req.body);
      if (error) {
        throw new HttpError(400, error.details[0].message);
      }
      const { key, description } = req.body;
      const result = await this.permissionService.createPermission(key, description);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  public deprecatePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { permissionId } = req.params;
      if (!permissionId) {
        throw new HttpError(400, "permission Id is required");
      }
      const result = await this.permissionService.deprecatePermission(permissionId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
