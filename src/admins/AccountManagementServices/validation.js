const Joi = require('@hapi/joi');

module.exports = {
  setAccountStatus: (status) => {
    const schema = Joi.object().keys({
      status: Joi.string().valid('Active','Suspended', 'Flagged for suspension', 'Flagged for reactivation').required(),
      comment: Joi.string().required()
    });      
    return schema.validate(status);
  }
};