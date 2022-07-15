const Joi = require('@hapi/joi');

function carRegistration(vehicle) {
  const schema = Joi.object().keys({    
    registration_certificate:Joi.string().required(),
    certificate_of_inspection:Joi.string().required(),
    insurance_certificate:Joi.string().required(),
    vehicle_image_front_view:Joi.string().required(),
    vehicle_image_back_view: Joi.string().required(),
    plate_number: Joi.string().required(),
    vehicleTypeId: Joi.string().required(),
    vehicle_name: Joi.string().required(),
    model_and_year: Joi.string().required()
  });

  return schema.validate(vehicle);
}

function update(vehicle) {
  const schema = Joi.object().keys({
    plate_number: Joi.string().required(),
    vehicleTypeId: Joi.string().required(),
    vehicle_name: Joi.string().required(),
    model_and_year: Joi.string().required(),
  });

  return schema.validate(vehicle);
}

module.exports = {
  carRegistration, update
};