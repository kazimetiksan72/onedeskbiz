const { z, objectId } = require('../common');

const vehicleBody = z.object({
  plate: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  modelYear: z.coerce.number().int().min(1900).max(2100),
  kilometer: z.coerce.number().int().min(0),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

const createVehicleSchema = z.object({
  body: vehicleBody,
  params: z.object({}),
  query: z.object({})
});

const updateVehicleSchema = z.object({
  body: vehicleBody.partial(),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const vehicleIdParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

module.exports = {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema
};
