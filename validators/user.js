const Joi = require("joi");
const response = require("../middlewares/response");

const name = Joi.string().min(2).max(30).label("name").messages({
  "string.base": `{#label} must be a type of string`,
  "string.min": `{#label} should have minimum length of {#limit}`,
  "string.max": `{#label} can not be more than {#limit}`,
  "any.required": `{#label} is required`,
});

const email = Joi.string().email().label("email").messages({
  "string.base": `{#label} must be a type of string`,
  "string.email": `{#label} must be a valid email address`,
  "any.required": `{#label} is required`,
});


const password = Joi.string().min(2).max(12).label("password").messages({
  "string.base": `{#label} must be a type of string`,
  "string.min": `{#label} should have minimum length of {#limit}`,
  "string.max": `{#label} can not be more than {#limit}`,
  "any.required": `{#label} is required`,
});
const role = Joi.string().valid("USER", "ADMIN") .label("role").messages({
    "string.base": `{#label} must be a type of string`,
    "any.required": `{#label} is required`,
    "any.only": `{#label} must be either USER or ADMIN`,
  });
const options = {
  errors: {
    wrap: {
      label: "",
    },
  },
};

const createUserObject = Joi.object({
  name: name.required(),
  email: email.required(),
  password: password.required(),
  role:role.required(),
});



const createValidate = async (req, res, next) => {
  try {
    console.log("+++++", req.body);
    await createUserObject.validateAsync(req.body, options);
  } catch (error) {
    console.log(error);
    return response.internalServerError(res, error.message);
  }
  next();
};

module.exports = {
  createValidate,
};
