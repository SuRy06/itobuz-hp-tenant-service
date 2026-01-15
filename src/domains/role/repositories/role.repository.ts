import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import { getRolesModel } from "../models/roles.model";

export interface roleDB {
  roleId: string;
  tenantId: string;
  name: string;
  status: "ACTIVE" | "DEPRECATED";
  permissions?: string[];
  roleVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class RoleRepository {
  constructor(private readonly mongoDBConnectionManager: MongoDBConnectionManager) {}

  public async findByName(tenantId: string, name: string): Promise<roleDB | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RoleModel = getRolesModel(connection);

    return RoleModel.findOne({ tenantId, name }).lean<roleDB>();
  }

  async create(data: { roleId: string; tenantId: string; name: string; roleVersion: number }): Promise<roleDB> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RoleModel = getRolesModel(connection);

    const created = await RoleModel.create({
      roleId: data.roleId,
      tenantId: data.tenantId,
      name: data.name,
      status: "ACTIVE",
      roleVersion: data.roleVersion,
    });

    return {
      roleId: created.roleId,
      tenantId: created.tenantId,
      name: created.name,
      status: created.status,
      roleVersion: created.roleVersion,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  public async updatePermissionsAtomic(tenantId: string, roleId: string, add: string[], remove: string[]) {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RoleModel = getRolesModel(connection);

    const updateOps: any = {};
    const metaOps: any = { $inc: { roleVersion: 1 } };

    if (add.length) {
      updateOps.$addToSet = {
        permissions: { $each: add },
      };
    }

    if (remove.length) {
      updateOps.$pullAll = {
        permissions: remove,
      };
    }

    return RoleModel.findOneAndUpdate(
      {
        roleId: roleId,
        tenantId: tenantId,
      },
      {
        ...updateOps,
        ...metaOps,
      },
      {
        new: true,
      }
    ).lean();
  }
  public async listByTenant(tenantId: string, limit: number, cursor: string | undefined): Promise<any> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RoleModel = getRolesModel(connection);

    const query: any = {
      tenantId: tenantId,
    };

    if (cursor) {
      const decoded = JSON.parse(Buffer.from(cursor, "base64").toString("utf8"));

      query.$or = [
        { createdAt: { $gt: new Date(decoded.createdAt) } },
        {
          createdAt: new Date(decoded.createdAt),
          _id: { $gt: decoded._id },
        },
      ];
    }

    const roles = await RoleModel.find(query)
      .sort({ createdAt: 1, roleId: 1 })
      .limit(limit + 1)
      .select({
        roleId: 1,
        name: 1,
        status: 1,
        roleVersion: 1,
        createdAt: 1,
      })
      .lean();

    return {
      roles,
    };
  }
  public async findByTenantAndRoleIds(tenantId: string, roleIds: string[]): Promise<any> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const RoleModel = getRolesModel(connection);

    return RoleModel.find({
      tenantId: tenantId,
      roleId: { $in: roleIds },
    })
      .select({ roleId: 1 })
      .lean();
  }
}
