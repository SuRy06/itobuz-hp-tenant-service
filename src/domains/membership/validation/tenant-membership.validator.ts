import Joi from "joi";

export const updateMembershipRolesSchema = Joi.object({
  add: Joi.array().items(Joi.string()).default([]),
  remove: Joi.array().items(Joi.string()).default([]),
});

export const permissionOverrideSchema = Joi.object({
  permissionId: Joi.string().required(),
  reason: Joi.string().optional(),
});

export const suspendTenantMemberSchema = Joi.object({
  reason: Joi.string().optional(),
});

export const assignRoleSchema = Joi.object({
  roleId: Joi.string().required(),
});

export const assignPermissionsSchema = Joi.object({
  permissionIds: Joi.array().items(Joi.string()).min(1).required(),
});
