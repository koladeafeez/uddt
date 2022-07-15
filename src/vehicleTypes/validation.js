const Joi = require('@hapi/joi');

function getAll(vehicleType) {
  const schema = Joi.object().keys({    
    pickupLocation:Joi.array().required(),
    destination:Joi.array().required(),
    currency: Joi.string().required(),
  });

  return schema.validate(vehicleType);
}

function create(vehicleType) {
    const schema = Joi.object().keys({
        picture: Joi.string().required(),
        vehicle_type: Joi.string().required(),
        base_charge: Joi.number().required(),
    });
  
    return schema.validate(vehicleType);
}

function update(vehicleType) {
    const schema = Joi.object().keys({
        vehicle_type: Joi.string().required(),
        base_charge: Joi.number().required()
    });

    return schema.validate(vehicleType);
}

module.exports = {
  create, update, getAll
};