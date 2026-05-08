const { z, objectId } = require('../common');

const lineItemSchema = z.object({
  description: z.string().min(1, 'Açıklama gereklidir.'),
  quantity: z.number().positive('Miktar pozitif olmalıdır.'),
  unitPrice: z.number().min(0, 'Birim fiyat negatif olamaz.'),
  vatRate: z.number().refine((v) => [0, 8, 10, 18, 20].includes(v), 'Geçersiz KDV oranı.').default(18)
});

const quoteBody = z.object({
  customerId: objectId,
  items: z.array(lineItemSchema).min(1, 'En az bir kalem gereklidir.'),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional(),
  currency: z.string().optional()
});

const updateQuoteBody = z.object({
  items: z.array(lineItemSchema).min(1).optional(),
  status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional(),
  currency: z.string().optional()
});

const createQuoteSchema = z.object({
  body: quoteBody,
  params: z.object({}),
  query: z.object({})
});

const updateQuoteSchema = z.object({
  body: updateQuoteBody,
  params: z.object({ id: objectId }),
  query: z.object({})
});

const quoteIdParamsSchema = z.object({
  body: z.object({}),
  params: z.object({ id: objectId }),
  query: z.object({})
});

const listQuotesSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    status: z.enum(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
    customerId: objectId.optional()
  })
});

module.exports = { createQuoteSchema, updateQuoteSchema, quoteIdParamsSchema, listQuotesSchema };
