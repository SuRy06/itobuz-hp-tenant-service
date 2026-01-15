import "reflect-metadata";
import { TenantMembershipController } from "../../../src/domains/membership/controllers/tenant-membership.controller";
import { TenantMembershipService } from "../../../src/domains/membership/services/tenant-membership.service";
import { HttpError } from "../../../src/domains/common/errors/http.error";

describe("TenantMembershipController", () => {
  let controller: TenantMembershipController;
  let service: jest.Mocked<TenantMembershipService>;

  let req: any;
  let res: any;
  let next: jest.Mock;

  beforeEach(() => {
    service = {
      updateMembershipRoles: jest.fn(),
      setOverride: jest.fn(),
      removeOverride: jest.fn(),
      suspendMembership: jest.fn(),
      unsuspendMembership: jest.fn(),
    } as any;

    controller = new TenantMembershipController(service);

    req = {
      params: {},
      body: {},
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

  describe("updateTenantMembershipRole", () => {
    it("should call next with validation error", async () => {
      req.params = { tenantId: "t1", userId: "u1" };
      req.body = {
        add: "NOT_AN_ARRAY",
        remove: [],
      };

      await controller.updateTenantMembershipRole(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should update tenant membership roles successfully", async () => {
      req.params = {
        tenantId: "t1",
        userId: "u1",
      };

      req.body = {
        add: ["r1"],
        remove: ["r2"],
      };

      const serviceResult = {
        tenantId: "t1",
        userId: "u1",
        roleIds: ["r1"],
        membershipVersion: 2,
        updatedAt: new Date(),
      };

      service.updateMembershipRoles.mockResolvedValue(serviceResult as any);

      await controller.updateTenantMembershipRole(req, res, next);

      expect(service.updateMembershipRoles).toHaveBeenCalledWith("t1", "u1", ["r1"], ["r2"]);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });
  });
  describe("Permission Overrides", () => {
    describe("allowPermissionOverride", () => {
      it("should call next with validation error", async () => {
        req.params = { tenantId: "t1", userId: "u1" };
        req.body = {}; // invalid body

        await controller.allowPermissionOverride(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(HttpError));
        expect(res.status).not.toHaveBeenCalled();
      });

      it("should allow permission override successfully", async () => {
        req.params = { tenantId: "t1", userId: "u1" };
        req.body = {
          permissionId: "p1",
          reason: "temporary access",
        };

        const result = {
          tenantId: "t1",
          userId: "u1",
          permissionId: "p1",
          effect: "ALLOW",
          membershipVersion: 2,
        };

        service.setOverride.mockResolvedValue(result as any);

        await controller.allowPermissionOverride(req, res, next);

        expect(service.setOverride).toHaveBeenCalledWith("t1", "u1", "p1", "ALLOW", "temporary access");

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(result);
      });
    });

    describe("denyPermissionOverride", () => {
      it("should call next with validation error", async () => {
        req.params = { tenantId: "t1", userId: "u1" };
        req.body = {}; // invalid body

        await controller.denyPermissionOverride(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(HttpError));
      });

      it("should deny permission override successfully", async () => {
        req.params = { tenantId: "t1", userId: "u1" };
        req.body = {
          permissionId: "p1",
          reason: "security",
        };

        const result = {
          tenantId: "t1",
          userId: "u1",
          permissionId: "p1",
          effect: "DENY",
          membershipVersion: 3,
        };

        service.setOverride.mockResolvedValue(result as any);

        await controller.denyPermissionOverride(req, res, next);

        expect(service.setOverride).toHaveBeenCalledWith("t1", "u1", "p1", "DENY", "security");

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(result);
      });
    });

    describe("removePermissionOverride", () => {
      it("should remove permission override successfully", async () => {
        req.params = {
          tenantId: "t1",
          userId: "u1",
          permissionId: "p1",
        };

        const result = {
          tenantId: "t1",
          userId: "u1",
          permissionId: "p1",
          deleted: true,
          membershipVersion: 4,
        };

        service.removeOverride.mockResolvedValue(result as any);

        await controller.removePermissionOverride(req, res, next);

        expect(service.removeOverride).toHaveBeenCalledWith("t1", "u1", "p1");

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(result);
      });
    });
  });
  describe("suspendTenantMember", () => {
    it("should suspend tenant membership successfully", async () => {
      req.params = { tenantId: "t1", userId: "u1" };
      req.body = {}; // valid if schema has no required body fields

      const result = {
        tenantId: "t1",
        userId: "u1",
        status: "SUSPENDED",
        membershipVersion: 2,
      };

      service.suspendMembership.mockResolvedValue(result as any);

      await controller.suspendTenantMember(req, res, next);

      expect(service.suspendMembership).toHaveBeenCalledWith("t1", "u1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });

  describe("unsuspendTenantMember", () => {
    it("should unsuspend tenant membership successfully", async () => {
      req.params = { tenantId: "t1", userId: "u1" };

      const result = {
        tenantId: "t1",
        userId: "u1",
        status: "ACTIVE",
        membershipVersion: 3,
      };

      service.unsuspendMembership.mockResolvedValue(result as any);

      await controller.unsuspendTenantMember(req, res, next);

      expect(service.unsuspendMembership).toHaveBeenCalledWith("t1", "u1");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(result);
    });
  });
});
