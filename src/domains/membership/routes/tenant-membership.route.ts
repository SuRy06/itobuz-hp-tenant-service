import { Router } from "express";
import { container } from "tsyringe";
import { TenantMembershipController } from "../controllers/tenant-membership.controller";

const router = Router();
const tenantMembershipController = container.resolve(TenantMembershipController);

router.patch("/:tenantId/user/:userId/roles", tenantMembershipController.updateTenantMembershipRole);

/**
 * @openapi
 * /v1/tenants/{tenantId}/users/{userId}/permissions/allow:
 *   post:
 *     tags:
 *       - Membership Permissions
 *     summary: Allow a permission for a user at membership level
 *     description: >
 *       Adds a membership-scoped permission override with effect **ALLOW**.
 *
 *       **Important precedence rule**:
 *       - If a **DENY** override exists for the same permission, it ALWAYS wins
 *         over ALLOW during authorization checks.
 *       - ALLOW does not override DENY.
 *
 *       Requires `TENANT_USER_PERMISSION_OVERRIDE` permission.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: string
 *                 description: Permission UUID from global registry
 *               reason:
 *                 type: string
 *                 example: Temporary access for project
 *     responses:
 *       201:
 *         description: Permission override created (ALLOW)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   format: uuid
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 permissionId:
 *                   type: string
 *                 effect:
 *                   type: string
 *                   enum: [ALLOW]
 *                 membershipVersion:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Missing TENANT_USER_PERMISSION_OVERRIDE
 *       404:
 *         description: Permission not found in registry
 */
router.post("/:tenantId/users/:userId/permissions/allow", tenantMembershipController.allowPermissionOverride);

/**
 * @openapi
 * /v1/tenants/{tenantId}/users/{userId}/permissions/deny:
 *   post:
 *     tags:
 *       - Membership Permissions
 *     summary: Deny a permission for a user at membership level
 *     description: >
 *       Adds a membership-scoped permission override with effect **DENY**.
 *
 *       **DENY PRECEDENCE RULE**:
 *       - DENY **always wins** over role permissions and ALLOW overrides.
 *       - If both ALLOW and DENY exist, the effective permission is DENY.
 *       - This rule is enforced during authorization evaluation.
 *
 *       Requires `TENANT_USER_PERMISSION_OVERRIDE` permission.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: string
 *                 description: Permission UUID from global registry
 *               reason:
 *                 type: string
 *                 example: Restrict access
 *     responses:
 *       201:
 *         description: Permission override created (DENY)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   format: uuid
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 permissionId:
 *                   type: string
 *                 effect:
 *                   type: string
 *                   enum: [DENY]
 *                 membershipVersion:
 *                   type: integer
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Missing TENANT_USER_PERMISSION_OVERRIDE
 *       404:
 *         description: Permission not found in registry
 */
router.post("/:tenantId/users/:userId/permissions/deny", tenantMembershipController.denyPermissionOverride);

/**
 * @openapi
 * /v1/tenants/{tenantId}/users/{userId}/permissions/{permissionId}:
 *   delete:
 *     tags:
 *       - Membership Permissions
 *     summary: Remove a membership-level permission override
 *     description: >
 *       Removes an existing permission override regardless of effect (ALLOW or DENY).
 *
 *       After removal, permission resolution falls back to role-based permissions.
 *
 *       Requires `TENANT_USER_PERMISSION_OVERRIDE` permission.
 *     parameters:
 *       - in: path
 *         name: tenantId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission override removed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   format: uuid
 *                 userId:
 *                   type: string
 *                   format: uuid
 *                 permissionId:
 *                   type: string
 *                 deleted:
 *                   type: boolean
 *                   example: true
 *                 membershipVersion:
 *                   type: integer
 *       403:
 *         description: Missing TENANT_USER_PERMISSION_OVERRIDE
 *       404:
 *         description: Override not found
 */
router.delete(
  "/:tenantId/users/:userId/permissions/:permissionId",
  tenantMembershipController.removePermissionOverride
);
router.post("/:tenantId/users/:userId/suspend", tenantMembershipController.suspendTenantMember);
router.post("/:tenantId/users/:userId/unsuspend", tenantMembershipController.unsuspendTenantMember);

export default router;
