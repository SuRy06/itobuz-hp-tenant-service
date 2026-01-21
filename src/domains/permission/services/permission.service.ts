import { promises as fs } from "fs";
import path from "path";
import { injectable } from "tsyringe";
import { permissionInterface, PermissionRepository } from "../repositories/permission.repository";
import { HttpError } from "../../common/errors/http.error";

interface PermissionRegistryEntry {
  permission_id: string;
  code: string;
  domain: string;
  description: string;
}

interface PermissionRegistryResponse {
  version: string;
  permissions: PermissionRegistryEntry[];
}

const permissionRegistryPath = path.join(__dirname, "..", "permissions.json");

@injectable()
export class PermissionService {
  private permissionRegistryCache?: PermissionRegistryResponse;

  constructor(private readonly permissionRepository: PermissionRepository) {}
  public async listPermission(
    status?: "ACTIVE" | "DEPRECATED",
    query?: string,
    limit?: number,
    cursor?: string
  ): Promise<any> {
    const pageLimit = Math.min(limit ?? 50, 100);

    const decodedCursor = cursor ? Buffer.from(cursor, "base64").toString("utf8") : undefined;

    const rows = await this.permissionRepository.listPermission({
      status: status,
      query: query,
      limit: pageLimit,
      cursor: decodedCursor,
    });

    const hasNext = rows.length > pageLimit;
    const data = hasNext ? rows.slice(0, pageLimit) : rows;

    const nextCursor = hasNext ? Buffer.from(String(data[data.length - 1]._id)).toString("base64") : null;

    return {
      data: data.map((p: any) => ({
        permissionId: p.permissionId,
        key: p.key,
        description: p.description,
        status: p.status,
      })),
      page: {
        limit,
        nextCursor: nextCursor,
      },
    };
  }
  public async createPermission(key: string, description: string): Promise<any> {
    const normalizedKey = key.trim().toUpperCase();

    if (!key || !description) {
      throw new HttpError(400, "Key and description are required");
    }

    const existing = await this.permissionRepository.findByKey(key);
    if (existing) {
      throw new HttpError(409, "Permission key already exists");
    }

    const permission = await this.permissionRepository.create({
      permissionId: crypto.randomUUID(),
      key: normalizedKey,
      description: description,
      status: "ACTIVE",
    });

    return {
      permissionId: permission.permissionId,
      key: permission.key,
      description: permission.description,
      status: permission.status,
      createdAt: permission.createdAt,
    };
  }
  public async deprecatePermission(permissionId: string): Promise<any> {
    const updated = await this.permissionRepository.updateStatus(permissionId, "DEPRECATED");

    if (!updated) {
      throw new HttpError(404, "Permission not found");
    }

    return {
      permissionId: updated.permissionId,
      status: updated.status,
      updatedAt: updated.updatedAt,
    };
  }

  public async getPermissionRegistry(): Promise<PermissionRegistryResponse> {
    if (this.permissionRegistryCache) {
      return this.permissionRegistryCache;
    }

    try {
      const raw = await fs.readFile(permissionRegistryPath, "utf-8");
      const parsed = JSON.parse(raw) as PermissionRegistryResponse;

      if (!parsed || !Array.isArray(parsed.permissions)) {
        throw new Error("Invalid permission registry payload");
      }

      this.permissionRegistryCache = parsed;

      return parsed;
    } catch (error) {
      throw new HttpError(500, "Failed to load permission registry");
    }
  }
}
