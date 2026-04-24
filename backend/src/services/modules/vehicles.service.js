const { Vehicle } = require('../../models/Vehicle');
const { ApiError } = require('../../utils/apiError');
const { getPagination } = require('../../utils/pagination');

function normalizeVehiclePayload(payload) {
  return {
    ...payload,
    plate: payload.plate?.trim().toUpperCase()
  };
}

async function createVehicle(payload) {
  return Vehicle.create(normalizeVehiclePayload(payload));
}

async function listVehicles({ page, limit, search }) {
  const { skip } = getPagination({ page, limit });
  const query = {};

  if (search) {
    query.$or = [
      { plate: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Vehicle.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(query)
  ]);

  return { items, total, page, limit };
}

async function updateVehicle(id, payload) {
  const vehicle = await Vehicle.findByIdAndUpdate(id, normalizeVehiclePayload(payload), {
    new: true,
    runValidators: true
  }).lean();

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  return vehicle;
}

async function deleteVehicle(id) {
  const vehicle = await Vehicle.findByIdAndDelete(id).lean();

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
}

module.exports = {
  createVehicle,
  listVehicles,
  updateVehicle,
  deleteVehicle
};
