const _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    smsService = require('../helpers/smsService'),
    helpers = require('../helpers/subroutines'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    mongoose = require('mongoose'),
{ Faq } = require('./model');

module.exports = {
    
    create: async (req, res) => {
        const { error } = validate.create(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const quest = await Faq.findOne({question:req.body.question.toLowerCase()});
        if(quest) return responseMessage.badRequest('Question Already Exist.', res);
       
        let faq = new Faq();  

        faq.question = req.body.question.toLowerCase();  
        faq.answer = req.body.answer.toLowerCase();
        faq.addedby = req.user._id;

        await faq.save();

        return responseMessage.created("Faq added Successfully",faq, res);
    },

    
    update: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.faqId)) return responseMessage.notFound('The faqId is required', res);
        let faq = await Faq.findOne({_id: req.params.faqId, IsDeleted: false});
        if(!faq) return responseMessage.notFound('Faq does not exist.', res);


        let somethingChanged = false;
        if(req.body.answer.toLowerCase() !== faq.answer.toLowerCase()){
            faq.answer = req.body.answer.toLowerCase();
            somethingChanged =true;
        }

        if(somethingChanged){
            await faq.save();
            return responseMessage.success('Faq updated successfully!', faq, res);
        }        

        return responseMessage.success('Nothing to update', data, res);
    },

   
    get: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.faqId)) return responseMessage.notFound('The Id is required', res);
        let faq = await Faq.findOne({_id: req.params.faqId, IsDeleted: false});
        if(!faq) return responseMessage.notFound('Faq does not exist.', res);


        return responseMessage.success('Faq found', faq, res);

       
    },


    delete: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.faqId)) return responseMessage.notFound('The faqId does not exist.', res);
        let vehicle = await Faq.findOne({_id: req.params.faqId, IsDeleted: false});
        if(!vehicle) return responseMessage.notFound('Faq not found.', res);

        vehicle.IsDeleted = true;
        vehicle.deletedAt = Date.now();
        await vehicle.save();

        return responseMessage.success('faq deleted sucessfully!', null, res);
    },


    getAll: async (req, res) => {

        var searchTerm = req.query.searchTerm;

      /*  if(searchTerm != null && searchTerm.length > 0)
        {
            var faq = Faq.find({ "question": { "$regex": searchTerm, "$options": "i" } },
            (errs, f)=>{
                if(errs){
                    responseMessage.internalServerError();
                }
                return responseMessage.success( faq.length +'faqs Found', f, res);
            }
            );

        }*/
        const faqs = await Faq.find({IsDeleted: false});
        if(faqs.length == 0) return responseMessage.notFound('No faq Found', res);

        return responseMessage.success('Listing all faqs', faqs, res);
    },

    
  

}