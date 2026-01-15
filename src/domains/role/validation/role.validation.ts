import Joi from "joi";

export const createRoleSchema = Joi.object({
  name: Joi.string().required(),
});

export const updateRolePermissionsSchema = Joi.object({
  add: Joi.array().items(Joi.string()).default([]),
  remove: Joi.array().items(Joi.string()).default([]),
});
