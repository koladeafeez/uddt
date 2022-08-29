const Joi = require('@hapi/joi');

function createByAdmin(notification) {
  const schema = Joi.object().keys({
    subject : Joi.string().required(),
    message : Joi.string().required(),
    recipent : Joi.string().required(),
    recipentRole : Joi.string().required()
  });

  return schema.validate(notification);
}

function createBySuperAdmin(notification) {
    const schema = Joi.object().keys({
      subject : Joi.string().required(),
      message : Joi.string().required(),
      recipent : Joi.string().required(),
    });
  
    return schema.validate(notification);
  }

module.exports = {
    createByAdmin, createBySuperAdmin
};


