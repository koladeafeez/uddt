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

        let user =  await Admin.findById(req.user._id);


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

readNotifications : async(req,res) => {
    
    if(req.body.ids == null || req.body.ids.length == 0) return responseMessage.badRequest("Input Valid Id(s) In request", res );

    req.body.ids.forEach(async(element) => {
        await Notification.findOneAndUpdate({_id : element},{hasRead : true});

    });

    return responseMessage.created("Notification(s) Updated",true, res);
},




deleteNotifications : async(req,res) => {
    
    if(req.body.ids == null || req.body.ids.length == 0) return responseMessage.badRequest("Input Valid Id(s) In request", res );

    req.body.ids.forEach(async(element) => {
        await Notification.findOneAndUpdate({_id : element},{isDeleted : true});

    });

    return responseMessage.created("Notification(s) Deleted",true, res);
},

    createBySuperAdmin: async (req, res) => {
        const { error } = validate.createByAdmin(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let user =  await Admin.findById(req.user._id);
       
      let recipent = await Admin.findById(req.body.recipent);


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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return responseMessage.notFound('The id is required', res);
        let notify = await Notification.findOne({_id: req.params.id, isDeleted: false}).select(variables.notification);
        if(!notify) return responseMessage.notFound('Notification does not exist.', res);


        return responseMessage.success('Notification found', notify, res);
       
    },


    fetchForCarOwner : async(req, res) =>{
        const { page = 1, limit = 20 } = req.query;
        const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;
        
        try {
        const posts = await Notification.find({ recipent : req.user._id, recipentRole: "Car Owner", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).sort({createdAt: -1}).select(variables.notification)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
    
        const count = await Notification.find({ recipent : req.user._id, recipentRole: "Car Owner", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).countDocuments();
    
        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    
        return responseMessage.success('Listing  notifications.', data, res);
    
        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");
    
        }
    },
  

    fetchForCustomer : async(req, res) =>{


        const { page = 1, limit = 20 } = req.query;
        const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;
        
        try {
        const posts = await Notification.find({ recipent : req.user._id, recipentRole: "Customer", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).sort({createdAt: -1}).select(variables.notification)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
    
        const count = await Notification.find({ recipent : req.user._id, recipentRole: "Customer", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).countDocuments();
    
        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    
        return responseMessage.success('Listing  notifications.', data, res);
    
        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");
    
        }
    },


    fetchForDrivers : async(req, res) =>{

        const { page = 1, limit = 20 } = req.query;
        const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;
        
        try {
        const posts = await Notification.find({ recipent : req.user._id, recipentRole: "Driver", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).sort({createdAt: -1}).select(variables.notification)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
    
        const count = await Notification.find({ recipent : req.user._id, recipentRole: "Driver", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).countDocuments();
    
        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    
        return responseMessage.success('Listing  notifications.', data, res);
    
        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");
    
        }
    },

    fetchForAdmins: async(req, res) =>{

        const { page = 1, limit = 20 } = req.query;
        const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;
        
        try {
        const posts = await Notification.find({ recipent : req.user._id, recipentRole: "Admin", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).sort({createdAt: -1}).select(variables.notification)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
    
        const count = await Notification.find({ recipent : req.user._id, recipentRole: "Admin", isDeleted: false, createdAt: {
            $gte: startDate, 
            $lt: endDate
        }}).countDocuments();
    
        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };
    
        return responseMessage.success('Listing  notifications.', data, res);
    
        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");
    
        }
    }

}