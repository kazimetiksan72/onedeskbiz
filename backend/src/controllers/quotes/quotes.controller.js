const { asyncHandler } = require('../../utils/asyncHandler');
const quotesService = require('../../services/modules/quotes.service');

const createQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.createQuote(req.body, req.user._id);
  res.status(201).json(quote);
});

const listQuotes = asyncHandler(async (req, res) => {
  const result = await quotesService.listQuotes({
    page: Number(req.query.page || 1),
    limit: Number(req.query.limit || 20),
    status: req.query.status,
    customerId: req.query.customerId
  });
  res.json(result);
});

const getQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.getQuoteById(req.params.id);
  res.json(quote);
});

const updateQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.updateQuote(req.params.id, req.body);
  res.json(quote);
});

const deleteQuote = asyncHandler(async (req, res) => {
  await quotesService.deleteQuote(req.params.id);
  res.status(204).send();
});


const printQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.getQuoteById(req.params.id);
  const html = quotesService.buildPrintHtml(quote, 'quote');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

const downloadQuote = asyncHandler(async (req, res) => {
  const quote = await quotesService.getQuoteById(req.params.id);
  const pdfBuffer = await quotesService.buildQuotePdf(quote);
  const safeNumber = quote.number.replace(/[^a-zA-Z0-9-_]/g, '-');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeNumber}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  res.send(pdfBuffer);
});

module.exports = { createQuote, listQuotes, getQuote, updateQuote, deleteQuote, printQuote, downloadQuote };
