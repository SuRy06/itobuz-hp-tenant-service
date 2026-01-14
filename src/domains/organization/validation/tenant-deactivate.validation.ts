import Joi from "joi";

export const deactivateTenantSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional().messages({
    "string.max": "Reason cannot exceed 500 characters",
  }),
});
