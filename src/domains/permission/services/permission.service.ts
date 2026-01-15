import { injectable } from "tsyringe";
import { permissionInterface, PermissionRepository } from "../repositories/permission.repository";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class PermissionService {
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
}
