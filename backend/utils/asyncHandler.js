// Process the Promise returned by fn(req, res, next),
// If an error occurs through .catch(next), the next() function is called and the error is passed to the middleware chain.
// Wrapping with Promise.resolve() converts fn to a Promise even if it is a synchronous function that does not return a Promise.
// This is a safety feature that allows you to use .catch().
// (But this is not required, since controller functions usually always return a Promise due to the async keyword.)

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
