import express from "express";
import swaggerUi from "swagger-ui-express";
import { getOpenApiSpec } from "./openapi";

const router = express.Router();

const spec = getOpenApiSpec();

// Internal UI: Swagger UI for developers and internal microservices
router.use("/internal/docs", swaggerUi.serve, swaggerUi.setup(spec));

// Internal raw JSON (useful for automated tooling and internal consumers)
router.get("/internal/openapi.json", (req, res) => {
  res.json(spec);
});

// Public JSON endpoint meant to be proxied by the BFF. Controlled by env flag.
router.get("/openapi.json", (req, res) => {
  const enabled = process.env.ENABLE_PUBLIC_OPENAPI === "true";
  if (!enabled) {
    res.status(403).json({ message: "Public OpenAPI disabled" });
    return;
  }
  res.json(spec);
});

// Optional: Public lightweight UI (disabled by default). BFF can proxy the JSON and host its own UI.
router.get("/docs", (req, res) => {
  const enabled = process.env.ENABLE_PUBLIC_OPENAPI === "true";
  if (!enabled) {
    res.status(403).send("Public docs disabled");
    return;
  }
  // Redirect to internal UI or show the swagger UI directly
  res.redirect("/internal/docs");
});

export default router;
