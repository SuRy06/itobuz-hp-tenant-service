import Joi from "joi";

export const addUserToTenantSchema = Joi.object({
  userId: Joi.string().trim().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),
});
