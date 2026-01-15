import mongoose, { Schema, Document } from "mongoose";

export type permissionStatus = "ACTIVE" | "DEPRECATED";

export interface permissionDocument extends Document {
  permissionId: string;
  key: string;
  description: string;
  status: permissionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<permissionDocument>(
  {
    permissionId: {
      type: String,
      required: true,
    },

    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "DEPRECATED"],
      default: "ACTIVE",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

permissionSchema.index({ permissionId: 1 }, { unique: true, name: "uniqPermissionId" });

permissionSchema.index({ key: 1 }, { unique: true, name: "uniqPermissionKey" });

export function getPermissionsModel(connection: mongoose.Connection) {
  return connection.model<permissionDocument>("Permission", permissionSchema);
}
