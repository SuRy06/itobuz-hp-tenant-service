import { Router, Request, Response } from "express";
import { container } from "tsyringe";
import { TenantController } from "../controllers/tenant.controller";
import { validateRequest } from "../../../infrastructure/middleware/validateRequest.middleware";
import { validateParams } from "../../../infrastructure/middleware/validateParams.middleware";
import { deactivateTenantSchema } from "../validation/tenant-deactivate.validation";
import { addUserToTenantSchema } from "../validation/tenant-add-user.validation";
import { getUserPermissionsSchema } from "../validation/tenant-user-permissions.validation";

const router = Router();
const tenantController = container.resolve(TenantController);

/**
 * @openapi
 * /v1/tenants/{tenantId}/deactivate:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Deactivate a tenant
 *     description: |
 *       Set tenant status to DEACTIVATED to immediately block access without deletion.
 *       All auth checks must reject thereafter.
 *
 *       **Requirements:**
 *       - Requires TENANT_DEACTIVATE permission
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *         example: tenant_xyz789abc
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for deactivation
 *                 example: Contract ended
 *     responses:
 *       200:
 *         description: Tenant deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   description: Tenant identifier
 *                   example: tenant_xyz789abc
 *                 status:
 *                   type: string
 *                   enum: [DEACTIVATED]
 *                   description: Tenant status
 *                   example: DEACTIVATED
 *                 deactivatedAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the tenant was deactivated
 *                   example: 2025-12-18T10:40:00Z
 *       400:
 *         description: Bad request - Tenant already deactivated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant is already deactivated
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred
 */
router.post(
  "/:tenantId/deactivate",
  validateRequest(deactivateTenantSchema),
  tenantController.deactivateTenant
);

/**
 * @openapi
 * /v1/tenants/{tenantId}:
 *   get:
 *     summary: Get tenant details
 *     description: |
 *       Fetch tenant metadata to support UI and downstream services.
 *
 *       **Tenant isolation enforced**: Only users with membership can fetch tenant (or org admins)(to be implemented)
 *
 *       **Requires authentication** (to be implemented)
 *     tags:
 *       - Tenants
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the tenant
 *         example: tenant_a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *     responses:
 *       200:
 *         description: Tenant details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   description: Unique tenant identifier
 *                   example: tenant_a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                 orgId:
 *                   type: string
 *                   description: Organization identifier
 *                   example: org_12345678-90ab-cdef-1234-567890abcdef
 *                 name:
 *                   type: string
 *                   description: Tenant display name
 *                   example: Acme - Production
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, SUSPENDED, DEACTIVATED]
 *                   description: Current tenant status
 *                   example: ACTIVE
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Tenant creation timestamp
 *                   example: 2025-12-18T10:30:00Z
 *       400:
 *         description: Bad request - missing tenantId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant ID is required
 *       403:
 *         description: Forbidden - tenant isolation violation (caller lacks membership or org admin access)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied - insufficient permissions
 *       404:
 *         description: Tenant not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/:tenantId", tenantController.getTenant);

/**
 * @openapi
 * /v1/tenants/{tenantId}/users:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Add user to tenant
 *     description: |
 *       Activate membership for a known user ID in a tenant (used by admin panel or invite-accept flow).
 *       Ensures a user becomes an ACTIVE tenant member. If invited, transitions to ACTIVE.
 *
 *       **Requirements:**
 *       - Requires TENANT_USER_ADD permission
 *       - Enforces unique membership per user
 *       - Tenant must be ACTIVE
 *       - Organization must be ACTIVE
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *         example: tenant_xyz789abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User UUID to add to the tenant
 *                 example: user_uuid
 *     responses:
 *       201:
 *         description: User successfully added to tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   description: Tenant identifier
 *                   example: tenant_xyz789abc
 *                 userId:
 *                   type: string
 *                   description: User identifier
 *                   example: user_uuid
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE]
 *                   description: Membership status
 *                   example: ACTIVE
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the membership was created
 *                   example: 2025-12-18T10:00:00Z
 *       400:
 *         description: Bad request - Tenant not ACTIVE, Organization not ACTIVE, or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant must be ACTIVE to add users
 *       404:
 *         description: Tenant or Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Tenant not found
 *       409:
 *         description: Conflict - User already has membership in this tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User already has ACTIVE membership in this tenant
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: An unexpected error occurred
 */
router.post(
  "/:tenantId/users",
  validateRequest(addUserToTenantSchema),
  tenantController.addUserToTenant
);

/**
 * @openapi
 * /v1/tenants/{tenantId}/users/{userId}/permissions:
 *   get:
 *     tags:
 *       - Tenants
 *     summary: Get effective permissions for a tenant user
 *     description: |
 *       Returns the combined permissions for a user in a tenant (role-derived + direct permissions).
 *       Response is static for now and suitable for BFF Redis caching.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *         example: tenant_a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: user_123e4567-e89b-12d3-a456-426655440000
 *     responses:
 *       200:
 *         description: Permissions for the user in the tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: string
 *                   example: user_123e4567-e89b-12d3-a456-426655440000
 *                 tenant_id:
 *                   type: string
 *                   example: tenant_a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *                 membership_version:
 *                   type: integer
 *                   example: 12
 *                 permissions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["permission.code.1","permission.code.2"]
 */
router.get(
  "/:tenantId/users/:userId/permissions",
  validateParams(getUserPermissionsSchema),
  tenantController.getUserPermissions
);

export = router;
