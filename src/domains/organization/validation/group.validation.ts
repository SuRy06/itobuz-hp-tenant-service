import Joi from "joi";

export const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "Group name is required",
    "string.min": "Group name must be at least 2 characters long",
    "string.max": "Group name cannot exceed 100 characters",
    "any.required": "Group name is required",
  }),

  parentGroupId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "Parent group ID must be a valid UUID",
  }),
});
