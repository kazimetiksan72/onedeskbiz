const { z, objectId } = require('../common');

const emptyToUndefined = (value) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const updateBusinessCardSchema = z.object({
  body: z.object({
    displayName: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
    title: optionalString,
    phone: optionalString,
    email: z.preprocess(emptyToUndefined, z.string().email().optional()),
    website: z.preprocess(emptyToUndefined, z.string().url().optional()),
    address: optionalString,
    bio: optionalString,
    publicSlug: z
      .preprocess(emptyToUndefined, z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional()),
    isPublic: z.preprocess(toBoolean, z.boolean().optional())
  }),
  params: z.object({ employeeId: objectId }),
  query: z.object({})
});

const getPublicCardSchema = z.object({
  body: z.object({}),
  params: z.object({ slug: z.string().min(3) }),
  query: z.object({})
});

module.exports = { updateBusinessCardSchema, getPublicCardSchema };
