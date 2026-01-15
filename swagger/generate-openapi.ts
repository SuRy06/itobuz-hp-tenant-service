import fs from "fs";
import path from "path";
import LOG from "../src/library/logging";

async function generateAndWriteOpenApi() {
  try {
    const modulePath = path.join(__dirname, "..", "dist", "docs", "openapi.js");
    delete require.cache[require.resolve(modulePath)];
    const { getOpenApiSpec } = require(modulePath);

    if (!getOpenApiSpec) {
      throw new Error("getOpenApiSpec not found in openapi module");
    }

    const spec = getOpenApiSpec();

    const distDir = path.join(__dirname, "..", "dist");
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const outputPath = path.join(distDir, "openapi.json");
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

    LOG.info(`✓ OpenAPI spec written to ${outputPath}`);
    LOG.info(`  Spec title: ${spec.info?.title}`);
    LOG.info(`  Spec version: ${spec.info?.version}`);
    LOG.info(`  Total endpoints documented: ${Object.keys(spec.paths || {}).length}`);
    LOG.info(`  Endpoints tagged: ${spec.tags?.map((t: any) => t.name).join(", ") || "none"}`);

    const endpoints = Object.keys(spec.paths || {});
    if (endpoints.length === 0) {
      LOG.info("⚠️  No endpoints found. Ensure @openapi JSDoc blocks exist in route files.");
    } else {
      LOG.info(`  Endpoints (${endpoints.length}):`);
      endpoints.forEach((ep) => LOG.info(`    - ${ep}`));
    }
  } catch (error) {
    LOG.error("✗ Failed to generate OpenAPI spec:", error);
    process.exit(1);
  }
}

generateAndWriteOpenApi();
