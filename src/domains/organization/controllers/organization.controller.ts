import { Request, Response, NextFunction } from "express";
import { injectable } from "tsyringe";
import { OrganizationService } from "../services/organization.service";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  createOrganization = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name, type } = req.body;

      // Get userId from authenticated user (assuming it's in req.user)
      // @ts-ignore - Assuming auth middleware adds user to request
      // const ownerUserId = req.user?.userId || req.user?.id;
      const ownerUserId = "userId123"; // TEMP FIX UNTIL AUTH IS IN PLACE

      if (!ownerUserId) {
        throw new HttpError(401, "Unauthorized: User ID not found");
      }

      // Create organization
      const organization = await this.organizationService.createOrganization({
        name: name.trim(),
        type,
        ownerUserId,
      });

      res.status(201).json({
        orgId: organization.orgId,
        name: organization.name,
        type: organization.type,
        status: organization.status,
        ownerUserId: organization.ownerUserId,
        createdAt: organization.createdAt,
      });
    } catch (error) {
      next(error);
    }
  };

  addOrganizationMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orgId } = req.params;
      const { userId, role } = req.body;

      // Add member to organization
      const membership = await this.organizationService.addOrganizationMember(
        orgId,
        {
          userId: userId.trim(),
          role,
        }
      );

      res.status(201).json({
        orgId: membership.orgId,
        userId: membership.userId,
        role: membership.role,
        status: membership.status,
      });
    } catch (error) {
      next(error);
    }
  };
}
