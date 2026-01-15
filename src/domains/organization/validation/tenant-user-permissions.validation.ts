import Joi from "joi";

export const getUserPermissionsSchema = Joi.object({
  tenantId: Joi.string().trim().required().messages({
    "string.empty": "Tenant ID is required",
    "any.required": "Tenant ID is required",
  }),
  userId: Joi.string().trim().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});
