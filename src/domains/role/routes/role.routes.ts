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

router.get("/:tenantId/roles", roleController.listRole);

export default router;
