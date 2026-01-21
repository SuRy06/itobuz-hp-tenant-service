import { injectable } from "tsyringe";
import { HttpError } from "../../common/errors/http.error";
import { roleDB, RoleRepository } from "../repositories/role.repository";
import { PermissionRepository } from "../../permission/repositories/permission.repository";
import { TenantRepository } from "../../organization/repositories/tenant.repository";
import { RolePermissionRepository } from "../repositories/role-permission.repository";

@injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly rolePermissionRepository: RolePermissionRepository
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
      data: data.map((role: roleDB) => ({
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

  public async removePermissionFromRole(tenantId: string, roleId: string, permissionId: string): Promise<any> {
    // Verify permission exists
    const permission = await this.permissionRepository.findByPermissionId(permissionId);
    if (!permission) {
      throw new HttpError(404, "Permission not found");
    }

    // Verify role exists
    const role = await this.roleRepository.findByRoleId(tenantId, roleId);
    if (!role) {
      throw new HttpError(404, "Role not found");
    }

    // Check if role-permission mapping exists
    const rolePermission = await this.rolePermissionRepository.findByTenantRoleAndPermission(
      tenantId,
      roleId,
      permissionId
    );

    if (!rolePermission) {
      throw new HttpError(404, "Permission not assigned to this role");
    }

    // Remove permission from role
    await this.rolePermissionRepository.removePermission(tenantId, roleId, permissionId);

    // Increment role version
    const updatedRole = await this.roleRepository.updatePermissionsAtomic(tenantId, roleId, [], []);

    if (!updatedRole) {
      throw new HttpError(404, "Role not found");
    }

    // Increment tenant permission version to invalidate user permission caches
    const tenantVersionUpdate = await this.tenantRepository.incrementPermissionVersion(tenantId);

    return {
      roleId: updatedRole.roleId,
      tenantId: updatedRole.tenantId,
      roleVersion: updatedRole.roleVersion,
      tenantPermissionVersion: tenantVersionUpdate?.tenantPermissionVersion || 1,
      removedPermission: permissionId,
    };
  }
}
