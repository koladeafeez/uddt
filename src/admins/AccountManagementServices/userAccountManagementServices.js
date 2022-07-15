const _ = require('lodash'),
    validate = require('./validation'),
    responseMessages = require('../../helpers/responseMessages'),
    variables = require('../../helpers/parameters'),
    helpers = require('../../helpers/subroutines'),
    mongoose = require('mongoose'),
    { Driver } = require('../../drivers/model'),
    { DriverAccountActivity } = require('../../drivers/accountActivitiesModel'),
    { Customer } = require('../../customers/model'),
    { CustomerAccountActivity } = require('../../customers/accountActivitiesModel'),
    { CarOwner } = require('../../carOwners/model'),
{ CarOwnerAccountActivity } = require('../../carOwners/accountActivitiesModel');
const { RideRequest } = require('../../rideRequests/model'); // remove these imports later
const { Vehicle } = require('../../vehicles/model');
const { VehicleType } = require('../../vehicleTypes/model');

module.exports = {
    /*      Customer account management services    
    =====================================================*/
    flagCustomer: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.customerId)) return responseMessages.badRequest('Invalid customer.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const customer = await Customer.findById(req.params.customerId);
        if(!customer) return responseMessages.badRequest('Invalid customer', res);

        customer.accountStatus = req.body.status;
        await customer.save();
        
        // log this activity
        activityLogger('customer', customer._id, req.user._id, req.body.status, req.body.comment, CustomerAccountActivity);

        const data = _.pick(customer, variables.customerDetails);
        return responseMessages.success('Customer flagged successfully.', data, res);
    },

    fetchFlaggedCustomers: async (req, res) => {
        const customers = await Customer.find({ $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ] }).select(variables.customerDetails);
        if(customers.length == 0) return responseMessages.notFound('No flagged customers found.', res);

        return responseMessages.success('Below are the flagged customers.', customers, res);
    },

    activateOrSuspendCustomer: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.customerId)) return responseMessages.badRequest('Invalid customer.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const customer = await Customer.findOne({
            _id: req.params.customerId,
            $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ]
        });
        if(!customer) return responseMessages.notFound('No customer found', res);

        customer.accountStatus = req.body.status;
        await customer.save();
        
        // log this activity
        activityLogger('customer', customer._id, req.user._id, req.body.status, req.body.comment, CustomerAccountActivity);

        const data = _.pick(customer, variables.customerDetails);
        return responseMessages.success(`Customer ${req.body.status}.`, data, res);
    },

    /*      Driver account management services    
    =====================================================*/
    flagDriver: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.driverId)) return responseMessages.badRequest('Invalid driver.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const driver = await Driver.findById(req.params.driverId);
        if(!driver) return responseMessages.badRequest('Invalid driver', res);

        driver.accountStatus = req.body.status;
        await driver.save();
        
        // log this activity
        activityLogger('driver', driver._id, req.user._id, req.body.status, req.body.comment, DriverAccountActivity);

        const data = _.pick(driver, variables.driverDetails);
        return responseMessages.success('Driver flagged successfully.', data, res);
    },

    fetchFlaggedDrivers: async (req, res) => {
        const drivers = await Driver.find({ $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ] }).select(variables.driverDetails);
        if(drivers.length == 0) return responseMessages.notFound('No flagged drivers found.', res);

        return responseMessages.success('Below are the flagged drivers.', drivers, res);
    },

    activateOrSuspendDriver: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.driverId)) return responseMessages.badRequest('Invalid driver.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const driver = await Driver.findOne({
            _id: req.params.driverId,
            $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ]
        });
        if(!driver) return responseMessages.notFound('No driver found', res);

        driver.accountStatus = req.body.status;
        await driver.save();
        
        // log this activity
        activityLogger('driver', driver._id, req.user._id, req.body.status, req.body.comment, DriverAccountActivity);

        const data = _.pick(driver, variables.driverDetails);
        return responseMessages.success(`Driver ${req.body.status}.`, data, res);
    },

    /*      CarOwner account management services    
    =====================================================*/
    flagCarOwner: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.carOwnerId)) return responseMessages.badRequest('Invalid carOwner.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const carOwner = await CarOwner.findById(req.params.carOwnerId);
        if(!carOwner) return responseMessages.badRequest('Invalid carOwner', res);

        carOwner.accountStatus = req.body.status;
        await carOwner.save();
        
        // log this activity
        activityLogger('carOwner', carOwner._id, req.user._id, req.body.status, req.body.comment, CarOwnerAccountActivity);

        const data = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessages.success('CarOwner flagged successfully.', data, res);
    },

    fetchFlaggedCarOwners: async (req, res) => {
        const carowners = await CarOwner.find({ $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ] }).select(variables.carOwnerDetails);
        if(carowners.length == 0) return responseMessages.notFound('No flagged carowners found.', res);

        return responseMessages.success('Below are the flagged carowners.', carowners, res);
    },

    activateOrSuspendCarOwner: async (req, res) => {
        if(!mongoose.isValidObjectId(req.params.carOwnerId)) return responseMessages.badRequest('Invalid carOwner.', res);
        const { error } = validate.setAccountStatus(req.body);
        if(error) return responseMessages.badRequest(error.details[0].message, res);

        const carOwner = await CarOwner.findOne({
            _id: req.params.carOwnerId,
            $or: [ { accountStatus: 'Flagged for suspension' }, { accountStatus: 'Flagged for reactivation' } ]
        });
        if(!carOwner) return responseMessages.notFound('No carOwner found', res);

        carOwner.accountStatus = req.body.status;
        await carOwner.save();

        // log this activity
        activityLogger('carOwner', carOwner._id, req.user._id, req.body.status, req.body.comment, CarOwnerAccountActivity);

        const data = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessages.success(`CarOwner ${req.body.status}.`, data, res);
    }
};

async function activityLogger(userType, userId, adminId, activity, comment, model){
    const accountActivity = new model();
    if(userType == 'customer') accountActivity.customerId = userId;
    if(userType == 'carOwner') accountActivity.carOwnerId = userId;
    if(userType == 'driver') accountActivity.driverId = userId;

    accountActivity.adminId = adminId;
    accountActivity.activity = activity;
    accountActivity.comment = comment;
    await accountActivity.save();
}