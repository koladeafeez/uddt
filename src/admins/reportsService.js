const _ = require('lodash'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    helpers = require('../helpers/subroutines'),
    mongoose = require('mongoose'),
    { Driver } = require('../drivers/model'),
    { Customer } = require('../customers/model'),
    { RideRequest } = require('../rideRequests/model'),
    { Admin } = require('./model'),
    { CarOwner } = require('../carOwners/model'),
{ Vehicle } = require('../vehicles/model');
const responseMessages = require('../helpers/responseMessages');

module.exports = {
    getActiveDrivers: async(req, res) => {
        const activeDrivers = await Driver.find({ isOnline: true, isApproved: true, accountStatus: 'Active' }).select(variables.driverDetails);
        if(activeDrivers.length == 0) return responseMessages.notFound('No active drivers found', res);

        return responseMessages.success('Showing all active drivers', activeDrivers, res);
    },

    getDriverTrips: async(req, res) => {
        if(!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessages.badRequest('Invalid driver', res);

        const driverTrips = await RideRequest.find({ driverId: req.params.driverId })
            .select(variables.rideRequestDetails)
        .populate('driverId', ['firstName', 'lastName']);
        if(driverTrips.length == 0) return responseMessages.notFound('This driver has no trips', res);

        return responseMessages.success('Showing all trips created by the selected driver', driverTrips, res);
    },

    getActiveCarOwners: async(req, res) => {
        const activeCarowners = await CarOwner.find({ isEmailVerified: true, accountStatus: 'Active' }).select(variables.carOwnerDetails);
        if(activeCarowners.length == 0) return responseMessages.notFound('No active carowners found', res);

        return responseMessages.success('Showing all active carowners', activeCarowners, res);
    },

    getActiveCustomers: async(req, res) => {
        const customers = await Customer.find({ accountStatus: 'Active', password: {$ne: null}}).select(variables.customerDetails);
        if(customers.length == 0) return responseMessages.notFound('No active customers found', res);

        return responseMessages.success('Showing a list of all active customers.', customers,  res);
    },

    getCustomerTrips: async(req, res) => {
        if(!mongoose.Types.ObjectId.isValid(req.params.customerId)) return responseMessages.badRequest('Invalid driver', res);

        const customerTrips = await RideRequest.find({ customerId: req.params.customerId })
            .select(variables.rideRequestDetails)
        .populate('customerId', ['firstName', 'lastName']);
        if(customerTrips.length == 0) return responseMessages.notFound('This customer has no trips', res);

        return responseMessages.success('Showing all trips created by the selected customer', customerTrips, res);
    },
};