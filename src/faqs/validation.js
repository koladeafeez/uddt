const Joi = require('@hapi/joi');

function create(faq) {
  const schema = Joi.object().keys({
    question: Joi.string().required(),
    answer: Joi.string().required()
  });

  return schema.validate(faq);
}



module.exports = {
    create
};