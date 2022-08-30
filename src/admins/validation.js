const Joi = require("@hapi/joi");

module.exports = {
  createAdmin: admin => {
    const schema = Joi.object().keys({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      country: Joi.string().required(),
      role: Joi.string().required(),
      email: Joi.string().required().email(),
      phone: Joi.string().required(),
      password: Joi.string().min(4).max(15).required(),
    });

    return schema.validate(admin);
  },

  phoneNumber: phone => {
    const schema = Joi.object().keys({
      phone: Joi.string().required(),
    });

    return schema.validate(phone);
  },

  login(user) {
    const schema = Joi.object().keys({
      email: Joi.string().required().email(),
      password: Joi.string().min(4).max(15).required(),
    });

    return schema.validate(user);
  },

  password: user => {
    const schema = Joi.object().keys({
      password: Joi.string().min(4).max(15).required(),
    });

    return schema.validate(user);
  },

  createCurrency: currency => {
    const schema = Joi.object().keys({
      currency: Joi.string().required(),
      newRate: Joi.number().required(),
    });

    return schema.validate(currency);
  },

  updateCurrency: currency => {
    const schema = Joi.object().keys({
      newRate: Joi.number().required(),
    });

    return schema.validate(currency);
  },

  currencyApproval: currency => {
    const schema = Joi.object().keys({
      status: Joi.string().required().valid('Approved', 'Disapproved'),
      comment: Joi.string().required()
    });

    return schema.validate(currency);
  },


};
