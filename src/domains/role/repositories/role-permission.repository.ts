import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import {
  getRolePermissionModel,
  RolePermissionDocument,
  PermissionEffect,
} from "../models/role-permission.model";

export interface RolePermissionInterface {
  tenantId: string;
  roleId: string;
  permissionId: string;
  effect: PermissionEffect;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class RolePermissionRepository {
  constructor(
    private readonly mongoDBConnectionManager: MongoDBConnectionManager
  ) {}

  public async findByTenantRoleAndPermission(
    tenantId: string,
    roleId: string,
    permissionId: string
  ): Promise<RolePermissionInterface | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RolePermissionModel = getRolePermissionModel(connection);

    return RolePermissionModel.findOne({
      tenantId,
      roleId,
      permissionId,
    }).lean<RolePermissionInterface>();
  }

  public async removePermission(
    tenantId: string,
    roleId: string,
    permissionId: string
  ): Promise<RolePermissionInterface | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RolePermissionModel = getRolePermissionModel(connection);

    return RolePermissionModel.findOneAndDelete({
      tenantId,
      roleId,
      permissionId,
    }).lean<RolePermissionInterface>();
  }

  public async attachPermissions(
    tenantId: string,
    roleId: string,
    permissionIds: string[]
  ): Promise<Array<{ permissionId: string; isNew: boolean }>> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RolePermissionModel = getRolePermissionModel(connection);

    const results: Array<{ permissionId: string; isNew: boolean }> = [];

    for (const permissionId of permissionIds) {
      // Check if the permission is already attached (idempotent)
      const existing = await RolePermissionModel.findOne({
        tenantId,
        roleId,
        permissionId,
      });

      if (existing) {
        results.push({ permissionId, isNew: false });
      } else {
        // Create new role-permission mapping
        await RolePermissionModel.create({
          tenantId,
          roleId,
          permissionId,
          effect: "ALLOW",
        });
        results.push({ permissionId, isNew: true });
      }
    }

    return results;
  }
}
