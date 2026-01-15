import { injectable } from "tsyringe";
import { getGroupModel } from "../models/group.model";
import { GroupInterface } from "../interfaces/group.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class GroupRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(groupData: Partial<GroupInterface>): Promise<GroupInterface> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    const group = new Group(groupData);
    return await group.save();
  }

  async findById(groupId: string): Promise<GroupInterface | null> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    return await Group.findOne({ groupId }).exec();
  }

  async findByIdAndTenant(groupId: string, tenantId: string): Promise<GroupInterface | null> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    return await Group.findOne({ groupId, tenantId }).exec();
  }

  async findByTenantId(tenantId: string): Promise<GroupInterface[]> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    return await Group.find({ tenantId }).exec();
  }

  async findByTenantAndParent(tenantId: string, parentGroupId: string | null): Promise<GroupInterface[]> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    return await Group.find({ tenantId, parentGroupId }).exec();
  }

  async findByNameAndParent(
    tenantId: string,
    name: string,
    parentGroupId: string | null
  ): Promise<GroupInterface | null> {
    const Group = getGroupModel(this.mongoManager.getConnection());
    return await Group.findOne({ tenantId, name, parentGroupId }).exec();
  }
}
