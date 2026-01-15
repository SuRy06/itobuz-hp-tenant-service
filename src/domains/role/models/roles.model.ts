import mongoose, { Schema, Document, model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export interface roleDocument extends Document {
  roleId: string;
  tenantId: string;
  name: string;
  status: "ACTIVE" | "DEPRECATED";
  permissions: string[];
  roleVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<roleDocument>(
  {
    roleId: {
      type: String,
      default: uuidv4,
      immutable: true,
    },

    tenantId: {
      type: String,
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "DEPRECATED"],
      default: "ACTIVE",
      uppercase: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    roleVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
roleSchema.index({ roleId: 1 }, { unique: true });

export function getRolesModel(connection: mongoose.Connection) {
  return connection.model<roleDocument>("Role", roleSchema);
}
