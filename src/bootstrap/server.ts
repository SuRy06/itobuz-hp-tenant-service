import express, { Request, Response, NextFunction } from "express";
import LOG from "../library/logging";
import healthRoutes from "../infrastructure/health/routes/health";
import organizationRoutes from "../domains/organization/routes/organization.route";
import tenantRoutes from "../domains/organization/routes/tenant.route";
import permissionRoutes from "../domains/permission/routes/permission.routes";
// docs
import docsRouter from "../docs/swaggerRouter";
import { notFoundMiddleware, globalErrorMiddleware } from "../infrastructure/middleware/error.middleware";

const createServer = () => {
  const app = express();
  const skipLogPaths = new Set<string>(["/readiness", "/health", "/health/readiness"]);

  app.use((req, res, next) => {
    const skip = skipLogPaths.has(req.url);
    const startHr = process.hrtime.bigint();
    if (!skip) {
      LOG.info("Request Start", {
        method: req.method,
        url: req.url,
        ip: req.socket.remoteAddress,
      });
    }
    res.on("finish", () => {
      if (skip) return;
      const endHr = process.hrtime.bigint();
      const durationMs = Number(endHr - startHr) / 1_000_000;
      LOG.info("Request End", {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        ip: req.socket.remoteAddress,
        duration_ms: Number(durationMs.toFixed(2)),
      });
    });
    next();
  });

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-reliance-authorization"
    );

    if (req.method == "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      res.status(200).json({});
      return;
    }

    next();
  });

  app.use(docsRouter);
  app.use("/health", healthRoutes);
  app.use("/v1/orgs", organizationRoutes);
  app.use("/v1/tenants", tenantRoutes);

  app.use("/v1/permissions", permissionRoutes);

  /** Error handling */
  app.use(notFoundMiddleware);
  app.use(globalErrorMiddleware);

  return app;
};

export default createServer;
