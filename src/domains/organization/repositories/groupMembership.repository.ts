import { injectable } from "tsyringe";
import { getGroupMembershipModel } from "../models/groupMembership.model";
import { GroupMembershipInterface } from "../interfaces/groupMembership.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class GroupMembershipRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(
    membershipData: Partial<GroupMembershipInterface>
  ): Promise<GroupMembershipInterface> {
    const GroupMembership = getGroupMembershipModel(
      this.mongoManager.getConnection()
    );
    const membership = new GroupMembership(membershipData);
    return await membership.save();
  }

  async findByGroupAndUser(
    groupId: string,
    userId: string
  ): Promise<GroupMembershipInterface | null> {
    const GroupMembership = getGroupMembershipModel(
      this.mongoManager.getConnection()
    );
    return await GroupMembership.findOne({ groupId, userId }).exec();
  }

  async deleteByGroupAndUser(
    groupId: string,
    userId: string
  ): Promise<boolean> {
    const GroupMembership = getGroupMembershipModel(
      this.mongoManager.getConnection()
    );
    const result = await GroupMembership.deleteOne({ groupId, userId }).exec();
    return result.deletedCount > 0;
  }
}
