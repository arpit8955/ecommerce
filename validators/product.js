const Joi = require("joi");
const response = require("../middlewares/response");

// --- Field Validations ---
const productName = Joi.string().min(2).max(50).label("productName").messages({
  "string.base": `{#label} must be a type of string`,
  "string.empty": `{#label} cannot be empty`,
  "string.min": `{#label} should have minimum length of {#limit}`,
  "string.max": `{#label} can not be more than {#limit}`,
  "any.required": `{#label} is required`,
});

const description = Joi.string()
  .allow("")
  .max(500)
  .label("description")
  .messages({
    "string.base": `{#label} must be a type of string`,
    "string.max": `{#label} can not be more than {#limit}`,
  });

const price = Joi.number().min(0).label("price").messages({
  "number.base": `{#label} must be a type of number`,
  "number.min": `{#label} must be greater than or equal to {#limit}`,
  "any.required": `{#label} is required`,
});

const stock = Joi.number().integer().min(0).label("stock").messages({
  "number.base": `{#label} must be a type of number`,
  "number.min": `{#label} must be greater than or equal to {#limit}`,
});

const reservedStock = Joi.number()
  .integer()
  .min(0)
  .label("reservedStock")
  .messages({
    "number.base": `{#label} must be a type of number`,
    "number.min": `{#label} must be greater than or equal to {#limit}`,
  });

const options = {
  errors: {
    wrap: {
      label: "",
    },
  },
};

// --- Schema for Creating a Product ---
const createProductObject = Joi.object({
  productName: productName.required(),
  description,
  price: price.required(),
  stock,
  reservedStock,
});

// --- Schema for Updating a Product ---
const updateProductObject = Joi.object({
  productName,
  description,
  price,
  stock,
  reservedStock,
});

// --- Middleware for Create Validation ---
const createValidate = async (req, res, next) => {
  try {
    await createProductObject.validateAsync(req.body, options);
    next();
  } catch (error) {
    return response.internalServerError(res, error.message);
  }
};

// --- Middleware for Update Validation ---
const updateValidate = async (req, res, next) => {
  try {
    await updateProductObject.validateAsync(req.body, options);
    next();
  } catch (error) {
    return response.internalServerError(res, error.message);
  }
};

module.exports = {
  createValidate,
  updateValidate,
};
