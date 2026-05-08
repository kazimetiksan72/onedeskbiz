const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/tasks.service');

const listTasks = asyncHandler(async (req, res) => {
  res.json(
    await service.listTasks(req.user, {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 100),
      status: req.query.status,
      assignedUserId: req.query.assignedUserId
    })
  );
});

const createTask = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createTask(req.user, req.body));
});

const getTask = asyncHandler(async (req, res) => {
  res.json(await service.getTask(req.user, req.params.id));
});

const updateTask = asyncHandler(async (req, res) => {
  res.json(await service.updateTask(req.user, req.params.id, req.body));
});

const deleteTask = asyncHandler(async (req, res) => {
  await service.deleteTask(req.user, req.params.id);
  res.status(204).send();
});

module.exports = { listTasks, createTask, getTask, updateTask, deleteTask };
