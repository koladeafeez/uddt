const Joi = require('@hapi/joi');

function registration(driver) {
  const schema = Joi.object().keys({
    id: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().required().email(),
    phone: Joi.string().required(),
    profile_picture: Joi.string().required(),
    drivers_license_front: Joi.string().required(),
    drivers_license_back: Joi.string().required(),
    password: Joi.string().min(4).max(15).required(),
  });

  return schema.validate(driver);
}

function phoneNumber(phone) {
  const schema = Joi.object().keys({
    phone: Joi.string().required(),
    country: Joi.string().required()
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

function profileUpdate(driver) {
  const schema = Joi.object().keys({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phone: Joi.string().allow(null),
    profile_picture: Joi.string().required(),
    drivers_license_front: Joi.string().required(),
    drivers_license_back: Joi.string().required(),
  });

  return schema.validate(driver);
}

function status(driver) {
  const schema = Joi.object().keys({
    driver_coordinates: Joi.array().allow(null),
    status: Joi.boolean().required()
  });

  return schema.validate(driver);
}

module.exports = {
    registration, phoneNumber, login, password, profileUpdate, status
};