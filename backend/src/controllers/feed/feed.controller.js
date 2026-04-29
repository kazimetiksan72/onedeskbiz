const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/feed.service');

const listPublished = asyncHandler(async (req, res) => {
  res.json(await service.listPublished({ limit: Number(req.query.limit || 20) }));
});

const listAdmin = asyncHandler(async (req, res) => {
  res.json(await service.listAdmin());
});

const createPost = asyncHandler(async (req, res) => {
  const item = await service.createPost(req.user, req.body, req.file);
  res.status(201).json(item);
});

const deletePost = asyncHandler(async (req, res) => {
  await service.deletePost(req.params.id);
  res.status(204).send();
});

module.exports = { listPublished, listAdmin, createPost, deletePost };
