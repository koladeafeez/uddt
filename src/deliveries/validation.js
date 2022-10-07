const Joi = require("@hapi/joi");

module.exports = {
  deliveryRequest: deliveryRequest => {
    const schema = Joi.object().keys({
      pickup_location: Joi.string().required(),
      destination: Joi.string().required(),
      pickup_coordinates: Joi.array().required(),
      destination_coordinates: Joi.array().required(),
      payment_mode: Joi.string().required(),
      currency: Joi.string(),
      //vehicleTypeId: Joi.string().required(),
      tripAmount: Joi.number().required(),
      recipientFullName : Joi.string().required(),
      recipientPhoneNumber : Joi.string().required(),
      //categoryId : Joi.string().required(),
      item : Joi.string().required(),
      estimatedCost : Joi.string().required(),
      quantity : Number,
      weight: Number,
      itemImage : Joi.string().required(),
      //estimatedDimension : joi.array().required(),
      itemCategory :  Joi.string().valid("small/medium", "large", "heavyWeight").required()
    });

    return schema.validate(deliveryRequest);
  },

  completeDeliveryRequest : completeDeliveryRequest => {
    const schema = Joi.object().keys({
        vehicleTypeId : joi.string().required()
    })

    return schema.validate(completeDeliveryRequest);
  }


};
