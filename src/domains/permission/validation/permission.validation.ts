import Joi from "joi";

export const listPermissionSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "DEPRECATED").optional(),
  query: Joi.string().trim().optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  cursor: Joi.string().optional(),
});

export const createPermissionSchema = Joi.object({
  key: Joi.string().required(),
  description: Joi.string().required(),
});
