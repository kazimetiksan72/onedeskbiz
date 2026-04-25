const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/contactActionLogs.service');

const createContactActionLog = asyncHandler(async (req, res) => {
  const item = await service.createContactActionLog(req.user, req.body);
  res.status(201).json(item);
});

const listContactActionLogs = asyncHandler(async (req, res) => {
  const result = await service.listContactActionLogs({
    user: req.user,
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 100),
    actionType: req.query.actionType
  });
  res.json(result);
});

const updateContactActionLogNote = asyncHandler(async (req, res) => {
  const item = await service.updateContactActionLogNote({
    user: req.user,
    id: req.params.id,
    note: req.body.note
  });
  res.json(item);
});

module.exports = { createContactActionLog, listContactActionLogs, updateContactActionLogNote };
