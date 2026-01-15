import "reflect-metadata";
import { RoleController } from "../../../src/domains/role/controllers/role.controller";
import { RoleService } from "../../../src/domains/role/services/role.service";
import { HttpError } from "../../../src/domains/common/errors/http.error";

describe("RoleController", () => {
  let controller: RoleController;
  let service: jest.Mocked<RoleService>;

  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      createRole: jest.fn(),
      updateRolePermissions: jest.fn(),
      listRoles: jest.fn(),
    } as any;

    controller = new RoleController(service);

    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createRole", () => {
    it("should call next with validation error", async () => {
      req.body = {}; // invalid body

      await controller.createRole(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should call next if tenantId is missing", async () => {
      req.body = { name: "Admin" };
      req.params = {};

      await controller.createRole(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should create role successfully", async () => {
      req.body = { name: "Admin" };
      req.params = { tenantId: "tenant-1" };

      const createdRole = {
        roleId: "r1",
        tenantId: "tenant-1",
        name: "ADMIN",
        status: "ACTIVE",
        roleVersion: 1,
        createdAt: new Date(),
      };

      service.createRole.mockResolvedValue(createdRole as any);

      await controller.createRole(req, res, next);

      expect(service.createRole).toHaveBeenCalledWith("Admin", "tenant-1");
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdRole);
    });
  });
  describe("updateRolePermissions", () => {
    it("should call next with validation error", async () => {
      req.body = {
        add: "NOT_AN_ARRAY",
        remove: [],
      };
      req.params = { tenantId: "t1", roleId: "r1" };

      await controller.updateRolePermissions(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should update role permissions successfully", async () => {
      req.params = {
        tenantId: "t1",
        roleId: "r1",
      };

      req.body = {
        add: ["p1"],
        remove: ["p2"],
      };

      const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        roleVersion: 2,
        permissions: ["p1"],
      };

      service.updateRolePermissions.mockResolvedValue(updatedRole as any);

      await controller.updateRolePermissions(req, res, next);

      expect(service.updateRolePermissions).toHaveBeenCalledWith("t1", "r1", ["p1"], ["p2"]);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedRole);
    });
  });
  describe("listRole", () => {
    it("should call next with error if tenantId is missing", async () => {
      req.params = {};
      req.query = {};

      await controller.listRole(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should list roles successfully with default limit", async () => {
      req.params = { tenantId: "tenant-1" };
      req.query = {}; // no limit, no cursor

      const serviceResult = {
        data: [
          {
            roleId: "r1",
            name: "ADMIN",
            status: "ACTIVE",
            roleVersion: 1,
          },
        ],
        page: {
          limit: 50,
          nextCursor: null,
        },
      };

      service.listRoles.mockResolvedValue(serviceResult as any);

      await controller.listRole(req, res, next);

      expect(service.listRoles).toHaveBeenCalledWith("tenant-1", 50, undefined);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    it("should cap limit to 100", async () => {
      req.params = { tenantId: "tenant-1" };
      req.query = { limit: "500" };

      service.listRoles.mockResolvedValue({ data: [], page: {} } as any);

      await controller.listRole(req, res, next);

      expect(service.listRoles).toHaveBeenCalledWith("tenant-1", 100, undefined);
    });

    it("should pass cursor to service", async () => {
      req.params = { tenantId: "tenant-1" };
      req.query = {
        limit: "10",
        cursor: "encoded-cursor",
      };

      service.listRoles.mockResolvedValue({ data: [], page: {} } as any);

      await controller.listRole(req, res, next);

      expect(service.listRoles).toHaveBeenCalledWith("tenant-1", 10, "encoded-cursor");
    });
  });
});
