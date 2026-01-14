import { injectable } from "tsyringe";
import { getOrganizationModel } from "../models/organization.model";
import { OrganizationInterface } from "../interfaces/organization.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class OrganizationRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(
    organizationData: Partial<OrganizationInterface>
  ): Promise<OrganizationInterface> {
    const Organization = getOrganizationModel(
      this.mongoManager.getConnection()
    );
    const organization = new Organization(organizationData);
    return await organization.save();
  }

  async findById(orgId: string): Promise<OrganizationInterface | null> {
    const Organization = getOrganizationModel(
      this.mongoManager.getConnection()
    );
    return await Organization.findOne({ orgId }).exec();
  }
}
