const express = require('express');
const controller = require('../../controllers/tasks/tasks.controller');
const { validate } = require('../../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('../../validators/modules/tasks.validator');

const router = express.Router();

router.get('/', controller.listTasks);
router.post('/', validate(createTaskSchema), controller.createTask);
router.get('/:id', controller.getTask);
router.patch('/:id', validate(updateTaskSchema), controller.updateTask);
router.delete('/:id', controller.deleteTask);

module.exports = router;
