import { injectable } from "tsyringe";
import { getTenantModel } from "../models/tenant.model";
import { TenantInterface } from "../interfaces/tenant.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class TenantRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(tenantData: Partial<TenantInterface>): Promise<TenantInterface> {
    const Tenant = getTenantModel(this.mongoManager.getConnection());
    const tenant = new Tenant(tenantData);
    return await tenant.save();
  }

  async findById(tenantId: string): Promise<TenantInterface | null> {
    const Tenant = getTenantModel(this.mongoManager.getConnection());
    return await Tenant.findOne({ tenantId }).exec();
  }

  async update(
    tenantId: string,
    updateData: Partial<TenantInterface>
  ): Promise<TenantInterface | null> {
    const Tenant = getTenantModel(this.mongoManager.getConnection());
    return await Tenant.findOneAndUpdate(
      { tenantId },
      { $set: updateData },
      { new: true }
    ).exec();
  }
}
