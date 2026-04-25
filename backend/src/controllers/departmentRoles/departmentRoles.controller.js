const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/departmentRoles.service');

const listRoles = asyncHandler(async (_req, res) => {
  res.json(await service.listDepartmentRoles());
});

const createRole = asyncHandler(async (req, res) => {
  const item = await service.createDepartmentRole(req.body);
  res.status(201).json(item);
});

const updateRole = asyncHandler(async (req, res) => {
  res.json(await service.updateDepartmentRole(req.params.id, req.body));
});

const deleteRole = asyncHandler(async (req, res) => {
  await service.deleteDepartmentRole(req.params.id);
  res.status(204).send();
});

const assignRole = asyncHandler(async (req, res) => {
  res.json(await service.assignRoleToUser(req.params.userId, req.body.departmentRoleId));
});

module.exports = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole
};
