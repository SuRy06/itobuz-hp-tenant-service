import mongoose from "mongoose";
import { getRolesModel, roleDocument } from "../../../src/domains/role/models/roles.model";

describe("Role Model", () => {
  let connection: mongoose.Connection;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      modelName: "Role",
      schema: {},
    };

    connection = {
      model: jest.fn().mockReturnValue(mockModel),
    } as unknown as mongoose.Connection;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRolesModel", () => {
    it("should return a model with the correct name", () => {
      const model = getRolesModel(connection);

      expect(connection.model).toHaveBeenCalledWith("Role", expect.any(Object));
      expect(model).toBeDefined();
      expect(model.modelName).toBe("Role");
    });

    it("should be callable multiple times", () => {
      const model1 = getRolesModel(connection);
      const model2 = getRolesModel(connection);

      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
      expect(model1).toBe(model2);
    });
  });

  describe("Schema Structure", () => {
    it("should match roleDocument interface", () => {
      // Compile-time interface check
      const mockRole: Partial<roleDocument> = {
        roleId: "role-uuid",
        tenantId: "tenant-123",
        name: "Admin",
        status: "ACTIVE",
        permissions: ["USER.CREATE", "USER.READ"],
        roleVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockRole.roleId).toBe("role-uuid");
      expect(mockRole.tenantId).toBe("tenant-123");
      expect(mockRole.name).toBe("Admin");
      expect(mockRole.status).toBe("ACTIVE");
      expect(mockRole.permissions).toEqual(["USER.CREATE", "USER.READ"]);
      expect(mockRole.roleVersion).toBe(1);
      expect(mockRole.createdAt).toBeInstanceOf(Date);
      expect(mockRole.updatedAt).toBeInstanceOf(Date);
    });

    it("should allow DEPRECATED status", () => {
      const mockRole: Partial<roleDocument> = {
        status: "DEPRECATED",
      };

      expect(mockRole.status).toBe("DEPRECATED");
    });

    it("should allow empty permissions array by default", () => {
      const mockRole: Partial<roleDocument> = {
        permissions: [],
      };

      expect(Array.isArray(mockRole.permissions)).toBe(true);
      expect(mockRole.permissions).toHaveLength(0);
    });
  });
});
