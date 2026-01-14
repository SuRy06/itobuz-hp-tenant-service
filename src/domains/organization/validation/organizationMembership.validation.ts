import Joi from "joi";
import { OrganizationMembershipRoleEnum } from "../../../types/config";

export const createOrganizationMembershipSchema = Joi.object({
  userId: Joi.string().trim().required().messages({
    "string.empty": "User ID is required",
    "any.required": "User ID is required",
  }),

  role: Joi.string()
    .valid(...Object.values(OrganizationMembershipRoleEnum))
    .required()
    .messages({
      "string.empty": "Organization Membership role is required",
      "any.only": `Organization Membership role must be one of: ${Object.values(
        OrganizationMembershipRoleEnum
      ).join(", ")}`,
      "any.required": "Organization Membership role is required",
    }),
});
