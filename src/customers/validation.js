const Joi = require('@hapi/joi');

function registration(customer) {
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    payment_mode: Joi.array().required(),
    currency: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.string().required(),
    password: Joi.string().min(4).max(15).required(),
  });

  return schema.validate(customer);
}

function phoneNumber(phone) {
  const schema = Joi.object().keys({
    phone: Joi.string().required(),
    country: Joi.string().required(),
  });

  return schema.validate(phone);
}

function login(user){
  const schema = Joi.object().keys({ 
      phone: Joi.string().required(), 
      password: Joi.string().min(4).max(15).required(),
      deviceId: Joi.string().required()
  });

  return schema.validate(user);
}

function password(user){
  const schema = Joi.object().keys({ 
    password: Joi.string().min(4).max(15).required()
  });

  return schema.validate(user);
}

function profileUpdate(customer) {
  const schema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow(null),
    payment_mode: Joi.array().allow(null)
  });

  return schema.validate(customer);
}

module.exports = {
    registration, phoneNumber, login, password, profileUpdate
};