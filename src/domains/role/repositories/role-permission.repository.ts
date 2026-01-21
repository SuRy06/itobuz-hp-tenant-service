import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import { getRolePermissionModel, RolePermissionDocument, PermissionEffect } from "../models/role-permission.model";

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
  constructor(private readonly mongoDBConnectionManager: MongoDBConnectionManager) {}

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
}
