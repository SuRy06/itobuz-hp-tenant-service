import { Request, Response, NextFunction } from "express";
import { injectable } from "tsyringe";
import { GroupService } from "../services/group.service";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tenantId } = req.params;
      const { name, parentGroupId } = req.body;

      if (!tenantId) {
        throw new HttpError(400, "Tenant ID is required");
      }

      // Create group
      const group = await this.groupService.createGroup({
        tenantId,
        name: name.trim(),
        parentGroupId: parentGroupId || undefined,
      });

      res.status(201).json({
        groupId: group.groupId,
        tenantId: group.tenantId,
        name: group.name,
        parentGroupId: group.parentGroupId || null,
        status: group.status,
        createdAt: group.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  addUserToGroup = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { tenantId, groupId } = req.params;
      const { userId } = req.body;

      if (!tenantId) {
        throw new HttpError(400, "Tenant ID is required");
      }

      if (!groupId) {
        throw new HttpError(400, "Group ID is required");
      }

      if (!userId) {
        throw new HttpError(400, "User ID is required");
      }

      // Add user to group
      const membership = await this.groupService.addUserToGroup(
        tenantId,
        groupId,
        { userId }
      );

      res.status(201).json({
        tenantId: membership.tenantId,
        groupId: membership.groupId,
        userId: membership.userId,
        status: membership.status,
        createdAt: new Date(),
      });
    } catch (error) {
      next(error);
    }
  };
}
