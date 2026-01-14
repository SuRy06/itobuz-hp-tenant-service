import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { CONFIG } from "../config/config";
import fs from "fs";

export function getOpenApiSpec() {
  const pkgInfo = {
    title: `${CONFIG.SERVICE_NAME} API`,
    version: "1.0.0",
    description: "Tenant Management API",
  };

  // Collect all route files explicitly
  const routeFiles: string[] = [];

  // Try to find route files from project root (works for both runtime and build contexts)
  let projectRoot = __dirname;
  // Navigate up until we find package.json
  while (projectRoot !== path.parse(projectRoot).root) {
    if (fs.existsSync(path.join(projectRoot, "package.json"))) {
      break;
    }
    projectRoot = path.dirname(projectRoot);
  }

  // Collect .ts files from src/ (preferred for build time and will work for runtime too via ts-loader)
  const srcDomainsPath = path.join(projectRoot, "src/domains");
  if (fs.existsSync(srcDomainsPath)) {
    const domainDirs = fs.readdirSync(srcDomainsPath);
    domainDirs.forEach((domain) => {
      const routesPath = path.join(srcDomainsPath, domain, "routes");
      if (fs.existsSync(routesPath)) {
        fs.readdirSync(routesPath)
          .filter((f) => f.endsWith(".ts"))
          .forEach((file) => routeFiles.push(path.join(routesPath, file)));
      }
    });
  }

  // Also collect from dist/ if available (runtime context with compiled JS)
  const distDomainsPath = path.join(projectRoot, "dist/domains");
  if (fs.existsSync(distDomainsPath) && routeFiles.length === 0) {
    const domainDirs = fs.readdirSync(distDomainsPath);
    domainDirs.forEach((domain) => {
      const routesPath = path.join(distDomainsPath, domain, "routes");
      if (fs.existsSync(routesPath)) {
        fs.readdirSync(routesPath)
          .filter((f) => f.endsWith(".js"))
          .forEach((file) => routeFiles.push(path.join(routesPath, file)));
      }
    });
  }

  // Collect from src/infrastructure
  const srcInfraPath = path.join(projectRoot, "src/infrastructure");
  if (fs.existsSync(srcInfraPath)) {
    const infraDirs = fs.readdirSync(srcInfraPath);
    infraDirs.forEach((infra) => {
      const routesPath = path.join(srcInfraPath, infra, "routes");
      if (fs.existsSync(routesPath)) {
        fs.readdirSync(routesPath)
          .filter((f) => f.endsWith(".ts"))
          .forEach((file) => routeFiles.push(path.join(routesPath, file)));
      }
    });
  }

  // Also collect from dist/infrastructure if available
  const distInfraPath = path.join(projectRoot, "dist/infrastructure");
  if (fs.existsSync(distInfraPath) && !fs.existsSync(srcInfraPath)) {
    const infraDirs = fs.readdirSync(distInfraPath);
    infraDirs.forEach((infra) => {
      const routesPath = path.join(distInfraPath, infra, "routes");
      if (fs.existsSync(routesPath)) {
        fs.readdirSync(routesPath)
          .filter((f) => f.endsWith(".js"))
          .forEach((file) => routeFiles.push(path.join(routesPath, file)));
      }
    });
  }

  const options: swaggerJSDoc.Options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: pkgInfo.title,
        version: pkgInfo.version,
        description: pkgInfo.description,
      },
      servers: [
        { url: `http://localhost:${CONFIG.SERVER.PORT}`, description: "Local" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      tags: [{ name: "Health", description: "Health and readiness endpoints" }],
    },
    apis: routeFiles,
  };

  const spec = swaggerJSDoc(options);
  return spec;
}
