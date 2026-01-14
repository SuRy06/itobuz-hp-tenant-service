import Joi from "joi";
import { OrganizationTypeEnum } from "../../../types/config";

export const createOrganizationSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Organization name is required",
    "string.min": "Organization name must be at least 2 characters long",
    "string.max": "Organization name cannot exceed 100 characters",
    "any.required": "Organization name is required",
  }),

  type: Joi.string()
    .valid(...Object.values(OrganizationTypeEnum))
    .required()
    .messages({
      "string.empty": "Organization type is required",
      "any.only": `Organization type must be one of: ${Object.values(
        OrganizationTypeEnum
      ).join(", ")}`,
      "any.required": "Organization type is required",
    }),
});
