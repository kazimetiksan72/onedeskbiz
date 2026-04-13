function getPagination({ page = 1, limit = 20 }) {
  const currentPage = Number(page);
  const currentLimit = Number(limit);

  return {
    page: currentPage,
    limit: currentLimit,
    skip: (currentPage - 1) * currentLimit
  };
}

module.exports = { getPagination };
