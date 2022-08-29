const _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    smsService = require('../helpers/smsService'),
    helpers = require('../helpers/subroutines'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    mongoose = require('mongoose'),
{ Notification } = require('./model'),
{ CarOwner } = require('../carOwners/model'),
{Driver} = require('../drivers/model'),
{Customer} = require('../customers/model'),
{Admin} = require('../admins/model');

module.exports = {
    
    createByAdmin: async (req, res) => {
        const { error } = validate.createByAdmin(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );
        if (!mongoose.Types.ObjectId.isValid(req.body.recipent)) return responseMessage.notFound('The Recipent does not exist.', res);

        let user =  await CarOwner.findById(req.user._id);


        let recipent = null;
        if(req.body.recipentRole == "Admin"){

       recipent = await Admin.findById(req.body.recipent);

        }else if(req.body.recipentRole == "Car Owner"){

      recipent = await CarOwner.findById(req.body.recipent);

        }else if(req.body.recipentRole == "Customer"){

            recipent = await Customer.findById(req.body.recipent);

        }else if(req.body.recipentRole == "Driver")
        {
            recipent = await Driver.findById(req.body.recipent);

        }else
        {
            return responseMessage.notFound('RecipentRole Not Supported', res);
        }

    if(!recipent) return responseMessage.notFound('Recipent does not exist.', res);
    


        let notify = new Notification();  
        notify.subject = req.body.subject;  
        notify.message = req.body.message.toLowerCase();
        notify.addedby = req.user._id;
        notify.role = user.role;
        notify.sender = user.firstName;
        notify.recipent = req.body.recipent;
        notify.recipentRole = req.body.recipentRole; 

        await notify.save();

        return responseMessage.created("notification sent Successfully",notify, res);
    },

    createBySuperAdmin: async (req, res) => {
        const { error } = validate.createByAdmin(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        //remove
        let user =  await CarOwner.findById(req.user._id);
       
        let recipent = null;
        if(req.recipentRole == "Admin"){

       recipent = await Admin.findById(req.body.recipent);

        }else if(req.recipentRole == "Car Owner"){

      recipent = await CarOwner.findById(req.body.recipent);

        }else if(req.recipentRole == "Customer"){

            recipent = await Customer.findById(req.body.recipent);

        }else if(req.recipentRole == "Driver")
        {
            recipent = await Driver.findById(req.body.recipent);

        }else
        {
            return responseMessage.notFound('RecipentRole Not Supported', res);
        }

    if(!recipent) return responseMessage.notFound('Recipent does not exist.', res);
    


        let notify = new Notification();  
        notify.subject = req.body.subject;  
        notify.message = req.body.message.toLowerCase();
        notify.addedby = req.user._id;
        notify.role = user.role;
        notify.sender = user.firstName;
        notify.recipent = req.body.recipent;
        notify.recipentRole = req.body.recipentRole; 


        await notify.save();

        return responseMessage.created("notification sent Successfully",notify, res);
    },



   
    get: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.faqId)) return responseMessage.notFound('The Id is required', res);
        let faq = await Faq.findOne({_id: req.params.notifyId, isDeleted: false});
        if(!faq) return responseMessage.notFound('Notification does not exist.', res);


        return responseMessage.success('Faq found', faq, res);

       
    },


    delete: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.notifyId)) return responseMessage.notFound('The notifyId does not exist.', res);
        let notify = await Faq.findOne({_id: req.params.notifyId, isDeleted: false});
        if(!notify) return responseMessage.notFound('Notification not found.', res);

        notify.isDeleted = true;
        notify.deletedAt = Date.now();
        notify.deletedBy = req.user._id;
        await vehicle.save();

        return responseMessage.success('Notification deleted sucessfully!', null, res);
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

    fetchForCarOwner : async(req, res) =>{

        let noti = await Notification.find({ recipent : req.user._id, recipentRole: "Car Owner", isDeleted: false}).select(variables.notification);
        if(noti.length == 0) return responseMessage.notFound('No Recent Notification.', res);


        return responseMessage.success('Recent Notification Found', noti, res);
    },
  

    fetchForCustomer : async(req, res) =>{

        let noti = await Notification.find({ recipent : req.user._id, recipentRole: "Customer", isDeleted: false}).select(variables.notification);
        if(noti.length == 0) return responseMessage.notFound('No Recent Notification.', res);

        return responseMessage.success('Recent Notification Found', noti, res);
    },


    fetchForDrivers : async(req, res) =>{

        let noti = await Notification.find({ recipent : req.user._id, recipentRole: "Driver", isDeleted: false}).select(variables.notification);
        if(noti.length == 0) return responseMessage.notFound('No Recent Notification.', res);

        return responseMessage.success('Recent Notification Found', noti, res);
    },

    fetchForAdmins: async(req, res) =>{

        let noti = await Notification.find({ recipent : req.user._id, recipentRole: "Admin", isDeleted: false}).select(variables.notification);
        if(noti.length == 0) return responseMessage.notFound('No Recent Notification.', res);


        return responseMessage.success('Recent Notification Found', noti, res);
    }

}