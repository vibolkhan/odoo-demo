export const buildPaginatedResult = (
  response,
  offset,
  limit,
  mapper = (record) => record,
) => {
  const records = (response.result?.records ?? []).map(mapper);
  const total = response.result?.length;

  return {
    records,
    total,
    hasMore:
      typeof total === "number"
        ? offset + records.length < total
        : records.length === limit,
  };
};
