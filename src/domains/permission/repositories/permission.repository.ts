import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import { getPermissionsModel, permissionDocument } from "../models/permissions.model";

interface listPermissionsParams {
  status?: "ACTIVE" | "DEPRECATED";
  query?: string;
  limit: number;
  cursor?: string;
}

export interface permissionInterface {
  permissionId: string;
  key: string;
  description: string;
  status: "ACTIVE" | "DEPRECATED";
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class PermissionRepository {
  constructor(private readonly mongoDBConnectionManager: MongoDBConnectionManager) {}

  public async listPermission(params: listPermissionsParams): Promise<any> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);

    const { status, query, limit, cursor } = params;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (query) {
      filter.$or = [{ key: { $regex: query, $options: "i" } }, { description: { $regex: query, $options: "i" } }];
    }

    if (cursor) {
      filter._id = { $gt: cursor };
    }

    const results = await PermissionModel.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .lean();

    return results;
  }

  async create(data: {
    permissionId: string;
    key: string;
    description: string;
    status: "ACTIVE";
  }): Promise<permissionDocument> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);

    return PermissionModel.create(data);
  }

  async findByKey(key: string): Promise<permissionInterface | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);
    return PermissionModel.findOne({ key }).lean<permissionInterface>();
  }

  async updateStatus(permissionId: string, status: "DEPRECATED"): Promise<permissionDocument | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);
    return PermissionModel.findOneAndUpdate({ permissionId }, { status }, { new: true });
  }

  public async findByIds(permissionIds: string[]) {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);

    return PermissionModel.find({
      permissionId: { $in: permissionIds },
    })
      .select({ permissionId: 1 })
      .lean();
  }

  public async findByPermissionId(permissionId: string): Promise<permissionDocument | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const PermissionModel = getPermissionsModel(connection);
    return PermissionModel.findOne({ permissionId: permissionId });
  }
}
