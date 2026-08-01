export function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err.stack || err.message || err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
