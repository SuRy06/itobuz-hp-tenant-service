import mongoose, { Schema, Document } from "mongoose";

export type PermissionEffect = "ALLOW" | "DENY";

export interface RolePermissionDocument extends Document {
  tenantId: string;
  roleId: string;
  permissionId: string;
  effect: PermissionEffect;
  createdAt: Date;
  updatedAt: Date;
}

const rolePermissionSchema = new Schema<RolePermissionDocument>(
  {
    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    roleId: {
      type: String,
      required: true,
      index: true,
    },

    permissionId: {
      type: String,
      required: true,
      index: true,
    },

    effect: {
      type: String,
      enum: ["ALLOW", "DENY"],
      default: "ALLOW",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
rolePermissionSchema.index({ tenantId: 1, roleId: 1 });
rolePermissionSchema.index({ tenantId: 1, roleId: 1, permissionId: 1 }, { unique: true });

export function getRolePermissionModel(connection: mongoose.Connection) {
  return connection.model<RolePermissionDocument>("RolePermission", rolePermissionSchema);
}
