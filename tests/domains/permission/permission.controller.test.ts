import "reflect-metadata";
import { PermissionController } from "../../../src/domains/permission/controllers/permission.controller";
import { PermissionService } from "../../../src/domains/permission/services/permission.service";
import { HttpError } from "../../../src/domains/common/errors/http.error";

describe("PermissionController", () => {
  let controller: PermissionController;
  let service: jest.Mocked<PermissionService>;

  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      listPermission: jest.fn(),
      createPermission: jest.fn(),
      deprecatePermission: jest.fn(),
    } as any;

    controller = new PermissionController(service);

    req = {
      query: {},
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

  describe("listPermission", () => {
    it("should call next with validation error", async () => {
      req.query = { limit: "invalid" }; // breaks Joi schema

      await controller.listPermission(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return permissions successfully", async () => {
      req.query = { status: "ACTIVE", limit: 10 };

      service.listPermission.mockResolvedValue({
        data: [{ key: "USER.READ" }],
        page: { limit: 10, nextCursor: null },
      } as any);

      await controller.listPermission(req, res, next);

      expect(service.listPermission).toHaveBeenCalledWith("ACTIVE", undefined, 10, undefined);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ key: "USER.READ" }],
        page: { limit: 10, nextCursor: null },
      });
    });
  });

  describe("createPermission", () => {
    it("should call next if validation fails", async () => {
      req.body = {}; // missing key & description

      await controller.createPermission(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
    });

    it("should create permission successfully", async () => {
      req.body = {
        key: "USER.CREATE",
        description: "Create user",
      };

      service.createPermission.mockResolvedValue({
        permissionId: "1",
        key: "USER.CREATE",
      } as any);

      await controller.createPermission(req, res, next);

      expect(service.createPermission).toHaveBeenCalledWith("USER.CREATE", "Create user");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        permissionId: "1",
        key: "USER.CREATE",
      });
    });
  });

  describe("deprecatePermission", () => {
    it("should call next if permissionId is missing", async () => {
      req.params = {};

      await controller.deprecatePermission(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should deprecate permission successfully", async () => {
      req.params = { permissionId: "1" };

      service.deprecatePermission.mockResolvedValue({
        permissionId: "1",
        status: "DEPRECATED",
      } as any);

      await controller.deprecatePermission(req, res, next);

      expect(service.deprecatePermission).toHaveBeenCalledWith("1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        permissionId: "1",
        status: "DEPRECATED",
      });
    });
  });
});
