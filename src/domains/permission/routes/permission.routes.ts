import { Router } from "express";
import { container } from "tsyringe";
import { PermissionController } from "../controllers/permission.controller";

const router = Router();
const permissionController = container.resolve(PermissionController);

/**
 * @openapi
 * /v1/permissions:
 *   get:
 *     tags:
 *       - Permissions
 *     summary: List permission definitions
 *     description: Returns global permission registry with pagination and filtering
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, DEPRECATED]
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       permissionId:
 *                         type: string
 *                       key:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                 page:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     nextCursor:
 *                       type: string
 *                       nullable: true
 */
router.get("/", permissionController.listPermission);

/**
 * @openapi
 * /v1/permissions:
 *   post:
 *     tags:
 *       - Permissions
 *     summary: Create a new permission (INTERNAL only)
 *     description: >
 *       Creates a globally unique permission definition.
 *       INTERNAL / system-only endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - description
 *             properties:
 *               key:
 *                 type: string
 *                 example: GROUP_CREATE
 *               description:
 *                 type: string
 *                 example: Create groups within a tenant
 *     responses:
 *       201:
 *         description: Permission created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissionId:
 *                   type: string
 *                   format: uuid
 *                 key:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE]
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Forbidden – INTERNAL access only
 *       409:
 *         description: Permission key already exists
 */
router.post("/", permissionController.createPermission);

/**
 * @openapi
 * /v1/permissions/{permissionId}/deprecate:
 *   patch:
 *     tags:
 *       - Permissions
 *     summary: Deprecate a permission (INTERNAL only)
 *     description: >
 *       Marks a permission as DEPRECATED.
 *       Deprecated permissions remain resolvable for existing roles
 *       but cannot be newly attached.
 *     parameters:
 *       - in: path
 *         name: permissionId
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [DEPRECATED]
 *                 example: DEPRECATED
 *     responses:
 *       200:
 *         description: Permission deprecated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 permissionId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: [DEPRECATED]
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Forbidden – INTERNAL access only
 *       404:
 *         description: Permission not found
 */
router.patch("/:permissionId/deprecate", permissionController.deprecatePermission);

export default router;
