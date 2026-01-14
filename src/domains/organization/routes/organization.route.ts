import { Router } from "express";
import { OrganizationController } from "../controllers/organization.controller";
import { validateRequest } from "../../../infrastructure/middleware/validateRequest.middleware";
import { createOrganizationSchema } from "../validation/organization.validation";
import { createOrganizationMembershipSchema } from "../validation/organizationMembership.validation";
import { createTenantSchema } from "../validation/tenant.validation";
import { TenantController } from "../controllers/tenant.controller";
import { container } from "../../../infrastructure/container";

const router = Router();
const organizationController = container.resolve(OrganizationController);
const tenantController = container.resolve(TenantController);

/**
 * @openapi
 * /v1/orgs:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Create a new organization
 *     description: Creates a new organization with the specified name and type
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Organization name
 *                 example: Acme Corporation
 *               type:
 *                 type: string
 *                 enum: [DIRECT, MSP, INTERNAL]
 *                 description: Organization type
 *                 example: DIRECT
 *     responses:
 *       201:
 *         description: Organization created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orgId:
 *                   type: string
 *                   description: Unique organization identifier
 *                   example: org_abc123xyz
 *                 name:
 *                   type: string
 *                   description: Organization name
 *                   example: Acme Corporation
 *                 type:
 *                   type: string
 *                   enum: [DIRECT, MSP, INTERNAL]
 *                   description: Organization type
 *                   example: DIRECT
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, SUSPENDED, DEACTIVATED]
 *                   description: Organization status
 *                   example: ACTIVE
 *                 ownerUserId:
 *                   type: string
 *                   description: User ID of the organization owner
 *                   example: user_123
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the organization was created
 *                   example: 2025-12-22T10:30:00Z
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization name is required
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
  "/",
  validateRequest(createOrganizationSchema),
  organizationController.createOrganization
);

/**
 * @openapi
 * /v1/orgs/{orgId}/tenants:
 *   post:
 *     tags:
 *       - Tenants
 *     summary: Create a new tenant
 *     description: |
 *       Creates a new tenant for the specified organization. This is the security boundary.
 *       Tenant creation bootstraps default roles (system roles) and attaches the creator membership as TENANT_OWNER.
 *
 *       **Requirements:**
 *       - Requires org-level permission (e.g. ORG_TENANT_CREATE)
 *       - Org must be ACTIVE
 *       - Tenant is not deletable once created
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *         example: org_abc123xyz
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
 *                 minLength: 2
 *                 maxLength: 100
 *                 description: Tenant name
 *                 example: Acme - Production
 *               bootstrap:
 *                 type: object
 *                 description: Bootstrap options for tenant creation
 *                 properties:
 *                   createDefaultRoles:
 *                     type: boolean
 *                     default: true
 *                     description: Create default system roles for the tenant
 *                 example:
 *                   createDefaultRoles: true
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tenantId:
 *                   type: string
 *                   description: Unique tenant identifier
 *                   example: tenant_xyz789abc
 *                 orgId:
 *                   type: string
 *                   description: Organization ID
 *                   example: org_abc123xyz
 *                 name:
 *                   type: string
 *                   description: Tenant name
 *                   example: Acme - Production
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, SUSPENDED, DEACTIVATED]
 *                   description: Tenant status
 *                   example: ACTIVE
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Timestamp when the tenant was created
 *                   example: 2025-12-18T10:30:00Z
 *       400:
 *         description: Bad request - Validation error or organization not ACTIVE
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization must be ACTIVE to create tenants
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization not found
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
  "/:orgId/tenants",
  validateRequest(createTenantSchema),
  tenantController.createTenant
);

/**
 * @openapi
 * /v1/orgs/{orgId}/members:
 *   post:
 *     tags:
 *       - Organizations
 *     summary: Add a member to an organization
 *     description: |
 *       Grant users administrative capabilities over the organization (billing/support/tenant creation).
 *       Adds a user to the organization with an org-level role.
 *
 *       **Requirements:**
 *       - Requires ORG_MEMBER_ADD permission
 *       - Organization must exist
 *       - Duplicate membership is rejected (idempotent for same role)
 *     parameters:
 *       - in: path
 *         name: orgId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *         example: abc123xyz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to add as member
 *                 example: user_uuid
 *               role:
 *                 type: string
 *                 enum: [ORG_OWNER, ORG_ADMIN, BILLING_ADMIN, SUPPORT]
 *                 description: Organization-level role for the user
 *                 example: BILLING_ADMIN
 *     responses:
 *       201:
 *         description: Organization member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orgId:
 *                   type: string
 *                   description: Organization ID
 *                   example: org_uuid
 *                 userId:
 *                   type: string
 *                   description: User ID
 *                   example: user_uuid
 *                 role:
 *                   type: string
 *                   enum: [ORG_OWNER, ORG_ADMIN, BILLING_ADMIN, SUPPORT]
 *                   description: Assigned role
 *                   example: BILLING_ADMIN
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, SUSPENDED]
 *                   description: Membership status
 *                   example: ACTIVE
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User ID is required
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Organization not found
 *       409:
 *         description: Conflict - User is already a member with a different role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User is already a member of this organization with a different role
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
  "/:orgId/members",
  validateRequest(createOrganizationMembershipSchema),
  organizationController.addOrganizationMember
);

export = router;
