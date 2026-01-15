import "reflect-metadata";
import { PermissionService } from "../../../src/domains/permission/services/permission.service";
import { PermissionRepository } from "../../../src/domains/permission/repositories/permission.repository";
import { HttpError } from "../../../src/domains/common/errors/http.error";

describe("PermissionService", () => {
  let service: PermissionService;
  let repository: jest.Mocked<PermissionRepository>;

  beforeEach(() => {
    repository = {
      listPermission: jest.fn(),
      create: jest.fn(),
      findByKey: jest.fn(),
      updateStatus: jest.fn(),
    } as any;

    service = new PermissionService(repository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listPermission", () => {
    it("should return paginated permissions with nextCursor", async () => {
      const permissions = [
        { _id: "1", permissionId: "1", key: "A", description: "A", status: "ACTIVE" },
        { _id: "2", permissionId: "2", key: "B", description: "B", status: "ACTIVE" },
        { _id: "3", permissionId: "3", key: "C", description: "C", status: "ACTIVE" }, // extra row
      ];

      repository.listPermission.mockResolvedValue(permissions as any);

      const result = await service.listPermission("ACTIVE", undefined, 2);

      expect(repository.listPermission).toHaveBeenCalledWith({
        status: "ACTIVE",
        query: undefined,
        limit: 2,
        cursor: undefined,
      });

      expect(result.data).toHaveLength(2);
      expect(result.page.nextCursor).toBe(Buffer.from("2").toString("base64"));
    });

    it("should decode cursor before passing to repository", async () => {
      const cursor = Buffer.from("10").toString("base64");

      repository.listPermission.mockResolvedValue([]);

      await service.listPermission(undefined, undefined, 10, cursor);

      expect(repository.listPermission).toHaveBeenCalledWith(expect.objectContaining({ cursor: "10" }));
    });

    it("should cap limit to 100", async () => {
      repository.listPermission.mockResolvedValue([]);

      await service.listPermission(undefined, undefined, 1000);

      expect(repository.listPermission).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });
  });

  describe("createPermission", () => {
    it("should throw 400 if key or description is missing", async () => {
      await expect(service.createPermission("", "")).rejects.toBeInstanceOf(HttpError);

      await expect(service.createPermission("", "")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("should throw 409 if permission already exists", async () => {
      repository.findByKey.mockResolvedValue({ key: "USER.READ" } as any);

      await expect(service.createPermission("USER.READ", "Read user")).rejects.toMatchObject({ statusCode: 409 });
    });

    it("should create permission successfully", async () => {
      repository.findByKey.mockResolvedValue(null);

      const created = {
        permissionId: "uuid",
        key: "USER.CREATE",
        description: "Create user",
        status: "ACTIVE",
        createdAt: new Date(),
      };

      repository.create.mockResolvedValue(created as any);

      const result = await service.createPermission("user.create", "Create user");

      expect(repository.create).toHaveBeenCalled();
      expect(result.permissionId).toBe("uuid");
      expect(result.status).toBe("ACTIVE");
    });
  });

  describe("deprecatePermission", () => {
    it("should deprecate permission", async () => {
      const updated = {
        permissionId: "1",
        status: "DEPRECATED",
        updatedAt: new Date(),
      };

      repository.updateStatus.mockResolvedValue(updated as any);

      const result = await service.deprecatePermission("1");

      expect(repository.updateStatus).toHaveBeenCalledWith("1", "DEPRECATED");
      expect(result.status).toBe("DEPRECATED");
    });

    it("should throw 404 if permission not found", async () => {
      repository.updateStatus.mockResolvedValue(null);

      await expect(service.deprecatePermission("unknown")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
