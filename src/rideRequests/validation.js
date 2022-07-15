const Joi = require("@hapi/joi");

module.exports = {
  rideRequest: rideRequest => {
    const schema = Joi.object().keys({
      pickup_location: Joi.string().required(),
      destination: Joi.string().required(),
      pickup_coordinates: Joi.array().required(),
      destination_coordinates: Joi.array().required(),
      payment_mode: Joi.string().required(),
      currency: Joi.string(),
      vehicleTypeId: Joi.string().required(),
      tripAmount: Joi.number().required(),
    });

    return schema.validate(rideRequest);
  },
};
