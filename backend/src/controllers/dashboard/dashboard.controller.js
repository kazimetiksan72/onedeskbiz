const { asyncHandler } = require('../../utils/asyncHandler');
const service = require('../../services/modules/dashboard.service');

const getDashboardSummary = asyncHandler(async (req, res) => {
  const data = await service.getDashboardSummary({
    department: req.query.department
  });
  res.json(data);
});

module.exports = { getDashboardSummary };
