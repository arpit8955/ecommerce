const successResponse = (res, data, message) => {
  res.status(200).json({ data: data, message: message, statusCode: 200 });
};
const errorResponse = (res, message, statusCode = 500) => {
  res.status(statusCode).json({ message: message, statusCode: statusCode });
};
const internalServerError = (res, message) => {
  res.status(500).json({ message: message, statusCode: 500 });
};
const notFoundError = (res, message) => {
  res.status(404).json({ message: message, statusCode: 404 });
};
const validationError = (res, message) => {
  res.status(400).json({ message: message, statusCode: 400 });
};
const tokenValidation = (res, message) => {
  res.status(401).json({ message: message, statusCode: 401 });
};
module.exports = {
  successResponse,
  errorResponse,
  internalServerError,
  notFoundError,
  validationError,
  tokenValidation,
};
