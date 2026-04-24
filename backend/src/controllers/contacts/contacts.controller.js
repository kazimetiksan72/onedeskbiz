const { asyncHandler } = require('../../utils/asyncHandler');
const contactsService = require('../../services/modules/contacts.service');

const createContact = asyncHandler(async (req, res) => {
  const item = await contactsService.createContact(req.body);
  res.status(201).json(item);
});

const listContacts = asyncHandler(async (req, res) => {
  const result = await contactsService.listContacts({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    search: req.query.search
  });
  res.json(result);
});

const getContact = asyncHandler(async (req, res) => {
  const item = await contactsService.getContactById(req.params.id);
  res.json(item);
});

const updateContact = asyncHandler(async (req, res) => {
  const item = await contactsService.updateContact(req.params.id, req.body);
  res.json(item);
});

const deleteContact = asyncHandler(async (req, res) => {
  await contactsService.deleteContact(req.params.id);
  res.status(204).send();
});

module.exports = {
  createContact,
  listContacts,
  getContact,
  updateContact,
  deleteContact
};
