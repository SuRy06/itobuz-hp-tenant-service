import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { GroupController } from "../../../../src/domains/organization/controllers/group.controller";
import { GroupService } from "../../../../src/domains/organization/services/group.service";
import { HttpError } from "../../../../src/domains/common/errors/http.error";

describe("GroupController", () => {
  let groupController: GroupController;
  let mockGroupService: jest.Mocked<GroupService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockGroupService = {
      createGroup: jest.fn(),
    } as any;

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    groupController = new GroupController(mockGroupService);
  });

  describe("createGroup", () => {
    it("should create a group successfully", async () => {
      const mockGroup = {
        groupId: "group-123",
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: "parent-123",
        status: "active",
        createdAt: new Date("2024-01-01"),
      } as any;

      mockRequest.params = { tenantId: "tenant-123" };
      mockRequest.body = { name: "Test Group", parentGroupId: "parent-123" };
      mockGroupService.createGroup.mockResolvedValue(mockGroup);

      await groupController.createGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGroupService.createGroup).toHaveBeenCalledWith({
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: "parent-123",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        groupId: "group-123",
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: "parent-123",
        status: "active",
        createdAt: mockGroup.createdAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should trim group name before creating", async () => {
      const mockGroup = {
        groupId: "group-123",
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: null,
        status: "active",
        createdAt: new Date("2024-01-01"),
      } as any;

      mockRequest.params = { tenantId: "tenant-123" };
      mockRequest.body = { name: "  Test Group  " };
      mockGroupService.createGroup.mockResolvedValue(mockGroup);

      await groupController.createGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGroupService.createGroup).toHaveBeenCalledWith({
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: undefined,
      });
    });

    it("should create group without parentGroupId", async () => {
      const mockGroup = {
        groupId: "group-123",
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: null,
        status: "active",
        createdAt: new Date("2024-01-01"),
      } as any;

      mockRequest.params = { tenantId: "tenant-123" };
      mockRequest.body = { name: "Test Group" };
      mockGroupService.createGroup.mockResolvedValue(mockGroup);

      await groupController.createGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockGroupService.createGroup).toHaveBeenCalledWith({
        tenantId: "tenant-123",
        name: "Test Group",
        parentGroupId: undefined,
      });
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          parentGroupId: null,
        })
      );
    });

    it("should throw HttpError when tenantId is missing", async () => {
      mockRequest.params = {};
      mockRequest.body = { name: "Test Group" };

      await groupController.createGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Tenant ID is required",
        })
      );
      expect(mockGroupService.createGroup).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws error", async () => {
      const error = new Error("Service error");
      mockRequest.params = { tenantId: "tenant-123" };
      mockRequest.body = { name: "Test Group" };
      mockGroupService.createGroup.mockRejectedValue(error);

      await groupController.createGroup(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
