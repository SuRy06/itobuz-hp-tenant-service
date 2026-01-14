import Joi from "joi";

export const createTenantSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Tenant name is required",
    "string.min": "Tenant name must be at least 2 characters long",
    "string.max": "Tenant name cannot exceed 100 characters",
    "any.required": "Tenant name is required",
  }),

  bootstrap: Joi.object({
    createDefaultRoles: Joi.boolean().default(true),
  }).default({
    createDefaultRoles: true,
  }),
});
