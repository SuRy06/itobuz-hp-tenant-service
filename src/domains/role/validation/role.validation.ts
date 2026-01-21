import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().required(),
});

export const updateRolePermissionsSchema = Joi.object({
  add: Joi.array().items(Joi.string()).default([]),
  remove: Joi.array().items(Joi.string()).default([]),
});

export const attachPermissionsSchema = Joi.object({
  permission_ids: Joi.array().items(Joi.string()).min(1).required(),
});
