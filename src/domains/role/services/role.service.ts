import { injectable } from "tsyringe";
import { HttpError } from "../../common/errors/http.error";
import { roleDB, RoleRepository } from "../repositories/role.repository";
import { PermissionRepository } from "../../permission/repositories/permission.repository";

@injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository
  ) {}

  public async createRole(name: string, tenantId: string): Promise<any> {
    if (!name || !name.trim()) {
      throw new HttpError(400, "Role name is required");
    }
    const normalizedName = name.toUpperCase();

    //TODO - Ensure tenant exists and is ACTIVE and check requester permissions

    const role = await this.roleRepository.create({
      roleId: crypto.randomUUID(),
      tenantId: tenantId,
      name: normalizedName,
      roleVersion: 1,
    });

    return {
      roleId: role.roleId,
      tenantId: role.tenantId,
      name: role.name,
      status: role.status,
      roleVersion: role.roleVersion,
      createdAt: role.createdAt,
    };
  }

  public async updateRolePermissions(
    tenantId: string,
    roleId: string,
    add: string[],
    remove: string[],
    requester?: any
  ): Promise<any> {
    // TODO - validate the permission from requester

    const allPermissionIds = [...add, ...remove];

    if (!allPermissionIds.length) {
      throw new HttpError(400, "Nothing to update");
    }

    const existingPermissions = await this.permissionRepository.findByIds(allPermissionIds);

    if (existingPermissions.length !== allPermissionIds.length) {
      throw new HttpError(400, "Invalid permission ID(s)");
    }

    const updatedRole = await this.roleRepository.updatePermissionsAtomic(tenantId, roleId, add, remove);

    if (!updatedRole) {
      throw new HttpError(404, "Role not found");
    }

    return {
      roleId: updatedRole.roleId,
      tenantId: updatedRole.tenantId,
      roleVersion: updatedRole.roleVersion,
      permissions: updatedRole.permissions,
    };
  }

  public async listRoles(tenantId: string, limit: number, cursor: string | undefined): Promise<any> {
    const decodedCursor = cursor ? Buffer.from(cursor, "base64").toString("utf8") : undefined;

    const { roles } = await this.roleRepository.listByTenant(tenantId, limit, decodedCursor);

    const hasNext = roles.length > limit;
    const data = hasNext ? roles.slice(0, limit) : roles;

    const nextCursor = hasNext ? Buffer.from(String(data[data.length - 1]._id)).toString("base64") : null;

    return {
      data: roles.map((role: roleDB) => ({
        roleId: role.roleId,
        name: role.name,
        status: role.status,
        roleVersion: role.roleVersion,
      })),
      page: {
        limit,
        nextCursor,
      },
    };
  }
}
