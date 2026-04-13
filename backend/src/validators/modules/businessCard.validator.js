const { z, objectId } = require('../common');

const getPublicCardSchema = z.object({
  body: z.object({}),
  params: z.object({ userId: objectId }),
  query: z.object({})
});

module.exports = { getPublicCardSchema };
