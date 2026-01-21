import "reflect-metadata";
import { RoleService } from "../../../src/domains/role/services/role.service";
import { RoleRepository } from "../../../src/domains/role/repositories/role.repository";
import { HttpError } from "../../../src/domains/common/errors/http.error";
import { PermissionRepository } from "../../../src/domains/permission/repositories/permission.repository";
import { TenantRepository } from "../../../src/domains/organization/repositories/tenant.repository";
import { RolePermissionRepository } from "../../../src/domains/role/repositories/role-permission.repository";

describe("RoleService", () => {
  let service: RoleService;
  let repository: jest.Mocked<RoleRepository>;
  let permissionRepository: jest.Mocked<PermissionRepository>;
  let tenantRepository: jest.Mocked<TenantRepository>;
  let rolePermissionRepository: jest.Mocked<RolePermissionRepository>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      updatePermissionsAtomic: jest.fn(),
      listByTenant: jest.fn(),
      removePermission: jest.fn(),
      findByRoleId: jest.fn(),
    } as any;

    permissionRepository = {
      findByIds: jest.fn(),
      findByPermissionId: jest.fn(),
    } as any;

    tenantRepository = {
      incrementPermissionVersion: jest.fn(),
    } as any;

    rolePermissionRepository = {
      findByTenantRoleAndPermission: jest.fn(),
      removePermission: jest.fn(),
    } as any;

    service = new RoleService(repository, permissionRepository, tenantRepository, rolePermissionRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRole", () => {
    it("should throw 400 if role name is empty", async () => {
      await expect(service.createRole("", "tenant-1")).rejects.toBeInstanceOf(HttpError);

      await expect(service.createRole("   ", "tenant-1")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should create role with normalized name", async () => {
      const createdRole = {
        roleId: "role-uuid",
        tenantId: "tenant-1",
        name: "ADMIN",
        status: "ACTIVE",
        roleVersion: 1,
        createdAt: new Date(),
      };

      repository.create.mockResolvedValue(createdRole as any);

      const result = await service.createRole("admin", "tenant-1");

      expect(repository.create).toHaveBeenCalledWith({
        roleId: expect.any(String),
        tenantId: "tenant-1",
        name: "ADMIN",
        roleVersion: 1,
      });

      expect(result).toEqual({
        roleId: createdRole.roleId,
        tenantId: createdRole.tenantId,
        name: createdRole.name,
        status: createdRole.status,
        roleVersion: createdRole.roleVersion,
        createdAt: createdRole.createdAt,
      });
    });
  });

  describe("updateRolePermissions", () => {
    it("should throw 400 if nothing to update", async () => {
      await expect(service.updateRolePermissions("t1", "r1", [], [])).rejects.toMatchObject({
        statusCode: 400,
        message: "Nothing to update",
      });
    });

    it("should throw 400 if any permission ID is invalid", async () => {
      permissionRepository.findByIds.mockResolvedValue([{ permissionId: "p1" }] as any); // missing one permission

      await expect(service.updateRolePermissions("t1", "r1", ["p1"], ["p2"])).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid permission ID(s)",
      });

      expect(permissionRepository.findByIds).toHaveBeenCalledWith(["p1", "p2"]);
    });

    it("should throw 404 if role not found", async () => {
      permissionRepository.findByIds.mockResolvedValue([{ permissionId: "p1" }, { permissionId: "p2" }] as any);

      repository.updatePermissionsAtomic.mockResolvedValue(null);

      await expect(service.updateRolePermissions("t1", "r1", ["p1"], ["p2"])).rejects.toMatchObject({
        statusCode: 404,
        message: "Role not found",
      });
    });

    it("should update role permissions successfully", async () => {
      permissionRepository.findByIds.mockResolvedValue([{ permissionId: "p1" }, { permissionId: "p2" }] as any);

      const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 2,
        permissions: ["p1"],
      } as any;

      repository.updatePermissionsAtomic.mockResolvedValue(updatedRole);

      const result = await service.updateRolePermissions("t1", "r1", ["p1"], ["p2"]);

      expect(permissionRepository.findByIds).toHaveBeenCalledWith(["p1", "p2"]);
      expect(repository.updatePermissionsAtomic).toHaveBeenCalledWith("t1", "r1", ["p1"], ["p2"]);

      expect(result).toEqual({
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 2,
        permissions: ["p1"],
      });
    });
  });

  describe("listRoles", () => {
    it("should list roles without next cursor when results <= limit", async () => {
      const roles = [
        {
          roleId: "r1",
          name: "ADMIN",
          status: "ACTIVE",
          roleVersion: 1,
        },
        {
          roleId: "r2",
          name: "USER",
          status: "ACTIVE",
          roleVersion: 1,
        },
      ];

      repository.listByTenant.mockResolvedValue({ roles } as any);

      const result = await service.listRoles("tenant-1", 2, undefined);

      expect(repository.listByTenant).toHaveBeenCalledWith("tenant-1", 2, undefined);

      expect(result).toEqual({
        data: [
          {
            roleId: "r1",
            name: "ADMIN",
            status: "ACTIVE",
            roleVersion: 1,
          },
          {
            roleId: "r2",
            name: "USER",
            status: "ACTIVE",
            roleVersion: 1,
          },
        ],
        page: {
          limit: 2,
          nextCursor: null,
        },
      });
    });

    it("should return nextCursor when more roles exist than limit", async () => {
      const roles = [
        {
          _id: "r1",
          roleId: "r1",
          name: "ADMIN",
          status: "ACTIVE",
          roleVersion: 1,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
        {
          _id: "r2",
          roleId: "r2",
          name: "USER",
          status: "ACTIVE",
          roleVersion: 1,
          createdAt: new Date("2024-01-01T00:00:01.000Z"),
        },
        {
          _id: "r3",
          roleId: "r3",
          name: "GUEST",
          status: "ACTIVE",
          roleVersion: 1,
          createdAt: new Date("2024-01-01T00:00:02.000Z"),
        },
      ];

      repository.listByTenant.mockResolvedValue({ roles } as any);

      const result = await service.listRoles("tenant-1", 2, undefined);

      const expectedCursor = Buffer.from(String(roles[1]._id)).toString("base64");

      expect(result.page.nextCursor).toBe(expectedCursor);
      expect(result.data).toHaveLength(2);
    });

    it("should decode cursor before calling repository", async () => {
      const decodedCursor = "decoded-cursor-value";
      const encodedCursor = Buffer.from(decodedCursor).toString("base64");

      repository.listByTenant.mockResolvedValue({ roles: [] });

      await service.listRoles("tenant-1", 10, encodedCursor);

      expect(repository.listByTenant).toHaveBeenCalledWith("tenant-1", 10, decodedCursor);
    });
  });

  describe("removePermissionFromRole", () => {
    it("should throw 404 if permission not found", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue(null);

      await expect(service.removePermissionFromRole("t1", "r1", "p1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Permission not found",
      });

      expect(permissionRepository.findByPermissionId).toHaveBeenCalledWith("p1");
      expect(repository.findByRoleId).not.toHaveBeenCalled();
    });

    it("should throw 404 if role not found", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ permissionId: "p1" } as any);
      repository.findByRoleId.mockResolvedValue(null);

      await expect(service.removePermissionFromRole("t1", "r1", "p1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Role not found",
      });

      expect(repository.findByRoleId).toHaveBeenCalledWith("t1", "r1");
    });

    it("should throw 404 if permission not assigned to role", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ permissionId: "p1" } as any);
      repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
      rolePermissionRepository.findByTenantRoleAndPermission.mockResolvedValue(null);

      await expect(service.removePermissionFromRole("t1", "r1", "p1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Permission not assigned to this role",
      });

      expect(rolePermissionRepository.findByTenantRoleAndPermission).toHaveBeenCalledWith("t1", "r1", "p1");
    });

    it("should remove permission from role and increment tenant version", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ permissionId: "p1" } as any);
      repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
      rolePermissionRepository.findByTenantRoleAndPermission.mockResolvedValue({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        effect: "ALLOW",
      } as any);

      const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 3,
        permissions: ["p2"],
      } as any;

      repository.updatePermissionsAtomic.mockResolvedValue(updatedRole);

      const tenantUpdate = {
        tenantId: "t1",
        tenantPermissionVersion: 5,
      } as any;

      tenantRepository.incrementPermissionVersion.mockResolvedValue(tenantUpdate);

      const result = await service.removePermissionFromRole("t1", "r1", "p1");

      expect(permissionRepository.findByPermissionId).toHaveBeenCalledWith("p1");
      expect(repository.findByRoleId).toHaveBeenCalledWith("t1", "r1");
      expect(rolePermissionRepository.findByTenantRoleAndPermission).toHaveBeenCalledWith("t1", "r1", "p1");
      expect(rolePermissionRepository.removePermission).toHaveBeenCalledWith("t1", "r1", "p1");
      expect(repository.updatePermissionsAtomic).toHaveBeenCalledWith("t1", "r1", [], []);
      expect(tenantRepository.incrementPermissionVersion).toHaveBeenCalledWith("t1");

      expect(result).toEqual({
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 3,
        tenantPermissionVersion: 5,
        removedPermission: "p1",
      });
    });

    it("should handle missing tenant version gracefully", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ permissionId: "p1" } as any);
      repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
      rolePermissionRepository.findByTenantRoleAndPermission.mockResolvedValue({ permissionId: "p1" } as any);

      const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 2,
      } as any;

      repository.updatePermissionsAtomic.mockResolvedValue(updatedRole);
      tenantRepository.incrementPermissionVersion.mockResolvedValue(null);

      const result = await service.removePermissionFromRole("t1", "r1", "p1");

      expect(result.tenantPermissionVersion).toBe(1);
    });

    describe("attachPermissionsToRole", () => {
      it("should throw 404 if role not found", async () => {
        repository.findByRoleId.mockResolvedValue(null);

        await expect(
        service.attachPermissionsToRole("t1", "r1", ["p1"])
        ).rejects.toMatchObject({
        statusCode: 404,
        message: "Role not found in this tenant",
        });

        expect(repository.findByRoleId).toHaveBeenCalledWith("t1", "r1");
        expect(permissionRepository.findByIds).not.toHaveBeenCalled();
      });

      it("should throw 400 if any permission ID is invalid", async () => {
        repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
        permissionRepository.findByIds.mockResolvedValue([
        { permissionId: "p1" },
        ] as any);

        await expect(
        service.attachPermissionsToRole("t1", "r1", ["p1", "p2"])
        ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid permission ID(s): p2",
        });

        expect(permissionRepository.findByIds).toHaveBeenCalledWith(["p1", "p2"]);
      });

      it("should attach permissions to role and increment versions", async () => {
        repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
        permissionRepository.findByIds.mockResolvedValue([
        { permissionId: "p1" },
        { permissionId: "p2" },
        ] as any);

        const attachedPermissions = [
        { permissionId: "p1", isNew: true },
        { permissionId: "p2", isNew: false },
        ] as any;

        rolePermissionRepository.attachPermissions = jest
        .fn()
        .mockResolvedValue(attachedPermissions);

        const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 4,
        } as any;

        repository.updatePermissionsAtomic.mockResolvedValue(updatedRole);

        const tenantUpdate = {
        tenantId: "t1",
        tenantPermissionVersion: 8,
        } as any;

        tenantRepository.incrementPermissionVersion.mockResolvedValue(tenantUpdate);

        const result = await service.attachPermissionsToRole("t1", "r1", [
        "p1",
        "p2",
        ]);

        expect(repository.findByRoleId).toHaveBeenCalledWith("t1", "r1");
        expect(permissionRepository.findByIds).toHaveBeenCalledWith(["p1", "p2"]);
        expect(rolePermissionRepository.attachPermissions).toHaveBeenCalledWith(
        "t1",
        "r1",
        ["p1", "p2"]
        );
        expect(repository.updatePermissionsAtomic).toHaveBeenCalledWith(
        "t1",
        "r1",
        [],
        []
        );
        expect(tenantRepository.incrementPermissionVersion).toHaveBeenCalledWith(
        "t1"
        );

        expect(result).toEqual({
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 4,
        tenantPermissionVersion: 8,
        attachedPermissions: ["p1", "p2"],
        newlyAttached: 1,
        });
      });

      it("should handle missing tenant version gracefully", async () => {
        repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
        permissionRepository.findByIds.mockResolvedValue([
        { permissionId: "p1" },
        ] as any);

        rolePermissionRepository.attachPermissions = jest
        .fn()
        .mockResolvedValue([{ permissionId: "p1", isNew: true }] as any);

        const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 2,
        } as any;

        repository.updatePermissionsAtomic.mockResolvedValue(updatedRole);
        tenantRepository.incrementPermissionVersion.mockResolvedValue(null);

        const result = await service.attachPermissionsToRole("t1", "r1", ["p1"]);

        expect(result.tenantPermissionVersion).toBe(1);
      });

      it("should throw 404 if role not found after attachment", async () => {
        repository.findByRoleId.mockResolvedValue({ roleId: "r1" } as any);
        permissionRepository.findByIds.mockResolvedValue([
        { permissionId: "p1" },
        ] as any);

        rolePermissionRepository.attachPermissions = jest
        .fn()
        .mockResolvedValue([{ permissionId: "p1", isNew: true }] as any);

        repository.updatePermissionsAtomic.mockResolvedValue(null);

        await expect(
        service.attachPermissionsToRole("t1", "r1", ["p1"])
        ).rejects.toMatchObject({
        statusCode: 404,
        message: "Role not found",
        });
      });
      });
  });
});
