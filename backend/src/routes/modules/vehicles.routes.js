const express = require('express');
const controller = require('../../controllers/vehicles/vehicles.controller');
const { validate } = require('../../middleware/validate');
const { requireRole } = require('../../middleware/requireRole');
const { ROLES } = require('../../constants/roles');
const {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamsSchema
} = require('../../validators/modules/vehicles.validator');

const router = express.Router();

router.get('/', controller.listVehicles);
router.post('/', requireRole(ROLES.ADMIN), validate(createVehicleSchema), controller.createVehicle);
router.patch('/:id', requireRole(ROLES.ADMIN), validate(updateVehicleSchema), controller.updateVehicle);
router.delete('/:id', requireRole(ROLES.ADMIN), validate(vehicleIdParamsSchema), controller.deleteVehicle);

module.exports = router;
