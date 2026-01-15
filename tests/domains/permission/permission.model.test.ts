import mongoose from "mongoose";
import { getPermissionsModel, permissionDocument } from "../../../src/domains/permission/models/permissions.model";

describe("Permissions Model", () => {
  let connection: mongoose.Connection;
  let PermissionsModel: mongoose.Model<permissionDocument>;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      modelName: "Permission",
      schema: {},
    };

    connection = {
      model: jest.fn().mockReturnValue(mockModel),
    } as unknown as mongoose.Connection;
  });

  describe("getPermissionsModel", () => {
    it("should return a model with the correct name", () => {
      const model = getPermissionsModel(connection);

      expect(connection.model).toHaveBeenCalledWith("Permission", expect.any(Object));
      expect(model).toBeDefined();
      expect(model.modelName).toBe("Permission");
    });

    it("should be callable multiple times", () => {
      const model1 = getPermissionsModel(connection);
      const model2 = getPermissionsModel(connection);

      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
      expect(model1).toBe(model2);
    });
  });

  describe("Schema Structure", () => {
    it("should match permissionDocument interface", () => {
      // Compile-time type safety check
      const mockPermission: Partial<permissionDocument> = {
        permissionId: "sdusdjiir",
        key: "USER.CREATE",
        description: "Create user permission",
        status: "ACTIVE",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockPermission.permissionId).toBe("sdusdjiir");
      expect(mockPermission.key).toBe("USER.CREATE");
      expect(mockPermission.description).toBe("Create user permission");
      expect(mockPermission.status).toBe("ACTIVE");
      expect(mockPermission.createdAt).toBeInstanceOf(Date);
      expect(mockPermission.updatedAt).toBeInstanceOf(Date);
    });

    it("should allow DEPRECATED status", () => {
      const mockPermission: Partial<permissionDocument> = {
        status: "DEPRECATED",
      };

      expect(mockPermission.status).toBe("DEPRECATED");
    });
  });
});
