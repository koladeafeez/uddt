const Joi = require('@hapi/joi');

function registration(carOwner) {
  const schema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    country: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.string().required(),
    password: Joi.string().min(4).max(15).required(),
  });

  return schema.validate(carOwner);
}

function phoneNumber(phone) {
  const schema = Joi.object().keys({
    phone: Joi.string().required(),
  });

  return schema.validate(phone);
}

function login(carOwner){
  const schema = Joi.object().keys({ 
      email: Joi.string().required().email(), 
      password: Joi.string().min(4).max(15).required()
  });

  return schema.validate(carOwner);
}

function password(carOwner){
  const schema = Joi.object().keys({ 
    password: Joi.string().min(4).max(15).required()
  });

  return schema.validate(carOwner);
}

function profileUpdate(customer) {
  const schema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow(null)
  });

  return schema.validate(customer);
}

module.exports = {
    registration, phoneNumber, login, password, profileUpdate
};