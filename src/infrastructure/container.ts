import "reflect-metadata";
import { container } from "tsyringe";
import { ApiService } from "./services/api.service";
import { MongoDBConnectionManager } from "./database/mongodbmanager.service";
import { OrganizationController } from "../domains/organization/controllers/organization.controller";
import { OrganizationService } from "../domains/organization/services/organization.service";
import { OrganizationRepository } from "../domains/organization/repositories/organization.repository";
import { TenantController } from "../domains/organization/controllers/tenant.controller";
import { TenantService } from "../domains/organization/services/tenant.service";
import { TenantRepository } from "../domains/organization/repositories/tenant.repository";
import { TenantMembershipRepository } from "../domains/organization/repositories/tenantMembership.repository";

// Register services
container.registerSingleton(ApiService);
container.registerSingleton(MongoDBConnectionManager);

// Register Organization components as singletons
container.registerSingleton(OrganizationRepository);
container.registerSingleton(OrganizationService);
container.registerSingleton(OrganizationController);

// Register Tenant components as singletons
container.registerSingleton(TenantRepository);
container.registerSingleton(TenantMembershipRepository);
container.registerSingleton(TenantService);
container.registerSingleton(TenantController);

export { container };
