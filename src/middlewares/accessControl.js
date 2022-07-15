const responseMessage = require('../helpers/responseMessages'),
    { CarOwner } = require('../carOwners/model'),
    { Driver } = require('../drivers/model'),
    { Customer } = require('../customers/model'),
{ Admin } = require('../admins/model');

module.exports = {
    isCarOwner: async (req, res, next) => {
        const carOwner = await CarOwner.findById(req.user._id);
        if (!carOwner) return responseMessage.forbidden('Access denied', res);
        next();
    },
    
    isDriver: async (req, res, next) => {
        const driver = await Driver.findById(req.user._id);
        if (!driver) return responseMessage.forbidden('Access denied', res);
        next();
    },
    
    isDriverOrCustomer: async (req, res, next) => {
        const driver = await Driver.findById(req.user._id),
            customer = await Customer.findById(req.user._id);
    
        if (!driver && !customer) return responseMessage.forbidden('Access denied', res);
        next();
    },
    
    isCustomer: async (req, res, next) => {
        const customer = await Customer.findById(req.user._id);
        if (!customer) return responseMessage.forbidden('Access denied', res);
        next();
    },
    
    isAdmin: async (req, res, next) => {
        const admin = await Admin.findById(req.user._id);
        if (!admin) return responseMessage.forbidden('Access denied', res);
        next();
    },
    
    isSuperAdmin: async (req, res, next) => {
        const superAdmin = await Admin.find({id: req.user._id, role: 'Super Admin', isDeleted: false});
        if (!superAdmin) return responseMessage.forbidden('Access denied', res);
        next();
    }
};