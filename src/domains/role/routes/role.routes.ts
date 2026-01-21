import { Router } from "express";
import { container } from "tsyringe";
import { RoleController } from "../controllers/role.controller";

const router = Router();
const roleController = container.resolve(RoleController);

/**
 * @openapi
 * /v1/tenants/{tenantId}/roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Create a custom role in a tenant
 *     description: Creates a tenant-scoped role with no permissions attached
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: MANAGER
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Tenant not found
 */
router.post("/:tenantId/roles", roleController.createRole);

router.patch("/:tenantId/roles/:roleId/permissions", roleController.updateRolePermissions);

/**
 * @openapi
 * /v1/tenants/{tenantId}/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Remove a permission from a role
 *     description: >
 *       Removes a specific permission from a role.
 *       Increments tenant_permission_version to invalidate user permission caches.
 *       Affected users lose the permission after cache refresh.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roleId:
 *                   type: string
 *                 tenantId:
 *                   type: string
 *                 roleVersion:
 *                   type: number
 *                 tenantPermissionVersion:
 *                   type: number
 *                 removedPermission:
 *                   type: string
 *       404:
 *         description: Role not found or permission not in role
 *       403:
 *         description: Forbidden
 */
router.delete("/:tenantId/roles/:roleId/permissions/:permissionId", roleController.removePermissionFromRole);

router.get("/:tenantId/roles", roleController.listRole);

export default router;
