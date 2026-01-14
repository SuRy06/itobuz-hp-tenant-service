import express from "express";
import { container } from "tsyringe";
import { HealthController } from "../healthController";

const router = express.Router();
const controller = container.resolve(HealthController);

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check endpoint
 *     description: Checks if the service is running and basic dependencies are healthy
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: Service is unhealthy
 */
router.get("/", controller.healthCheck);

/**
 * @openapi
 * /health/readiness:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness check endpoint
 *     description: Checks if the service is ready to handle traffic (all dependencies available)
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ready
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: connected
 *       503:
 *         description: Service is not ready
 */
router.get("/readiness", controller.readinessCheck);

export = router;
