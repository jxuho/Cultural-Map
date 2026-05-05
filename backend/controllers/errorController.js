module.exports = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'server internal error';

  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};
