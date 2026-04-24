const { asyncHandler } = require('../../utils/asyncHandler');
const vehiclesService = require('../../services/modules/vehicles.service');

const createVehicle = asyncHandler(async (req, res) => {
  const item = await vehiclesService.createVehicle(req.body);
  res.status(201).json(item);
});

const listVehicles = asyncHandler(async (req, res) => {
  const result = await vehiclesService.listVehicles({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    search: req.query.search
  });
  res.json(result);
});

const getVehicle = asyncHandler(async (req, res) => {
  const item = await vehiclesService.getVehicleById(req.params.id);
  res.json(item);
});

const updateVehicle = asyncHandler(async (req, res) => {
  const item = await vehiclesService.updateVehicle(req.params.id, req.body);
  res.json(item);
});

const deleteVehicle = asyncHandler(async (req, res) => {
  await vehiclesService.deleteVehicle(req.params.id);
  res.status(204).send();
});

module.exports = {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle
};
