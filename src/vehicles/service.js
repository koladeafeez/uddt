const _ = require('lodash'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    mongoose = require("mongoose"),
    { Vehicle } = require('./model'),
    { VehicleType } = require('../vehicleTypes/model'),
    { Driver } = require('../drivers/model'),

vehicle = {
    registration: async (req, res) => {
        const { error } = validate.carRegistration(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );
        if (!mongoose.Types.ObjectId.isValid(req.body.vehicleTypeId)) return responseMessage.notFound('Please enter a valid vehicle type.', res);
        
        const vehicleType = await VehicleType.findById(req.body.vehicleTypeId);
        if(!vehicleType) return responseMessage.notFound('Please enter a valid vehicle type.', res);

        const plateNumber = await Vehicle.findOne({ plate_number: req.body.plate_number });
        if(plateNumber) return responseMessage.badRequest('A vehicle has already been registered with this plate number.', res);

        const vehicle = new Vehicle(_.pick(req.body, variables.vehicleDetails));
        vehicle.ownerId = req.user._id;
        await vehicle.save(); 

        const data = _.pick(vehicle, variables.vehicleDetails);
        return responseMessage.success( 'Your vehicle been registered!', data, res );
    },

    findOne: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('The vehicle does not exist.', res);
        let vehicle = await Vehicle.findOne({_id: req.params.vehicleId, isDeleted: false});
        if(!vehicle) return responseMessage.notFound('The vehicle does not exist.', res);
        if(req.user._id != vehicle.ownerId) return responseMessage.forbidden('You are not allowed to view this vehicle', res);

        vehicle = _.pick(vehicle, variables.vehicleDetails);
        return responseMessage.success('vehicle retrieved sucessfully!', vehicle, res);
    },

    approvedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({isApproved: true, ownerId: req.user._id, isDeleted: false}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("You don't have any approved vehicles yet", res);

        return responseMessage.success('Displaying all approved vehicles.', vehicles, res);
    },

    disapprovedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({isApproved: false, ownerId: req.user._id, approvedOrDisapprovedBy: {$ne: null}, isDeleted: false }).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("You don't have any disapproved vehicles.", res);

        return responseMessage.success('Displaying all disapproved vehicles.', vehicles, res);
    },

    vehiclesAwaitingApproval: async (req, res) => {
        const vehicles = await Vehicle.find({isApproved: false, ownerId: req.user._id, approvedOrDisapprovedBy: null, isDeleted: false }).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("You don't have any vehicles pending approval.", res);

        return responseMessage.success('Displaying all vehicles pending approval.', vehicles, res);
    },

    unassignedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.user._id, isApproved: true, driverId: null, isDeleted: false }).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("All your vehicles have been assigned to drivers.", res);

        return responseMessage.success('Displaying all vehicles without driver.', vehicles, res);
    },

    getUserVehicles: async (req, res) => {
        const vehicle = await Vehicle.find({ownerId: req.user._id, isDeleted: false }).sort({createdAt: 1}).select(variables.vehicleDetails);
        if(vehicle.length == 0 ) return responseMessage.notFound('You have not uploaded any vehicles yet.', res);

        return responseMessage.success('vehicle retrieved sucessfully!', vehicle, res);
    },

    update: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('The vehicle does not exist.', res);
        let vehicle = await Vehicle.findOne({_id: req.params.vehicleId, isDeleted: false});
        if(!vehicle) return responseMessage.notFound('Vehicle does not exist.', res);
        if(req.user._id != vehicle.ownerId) return responseMessage.forbidden('Please consult the vehicle owner.', res);

        let somethingChanged = false;
        if(req.body.vehicle_image_front_view !== vehicle.vehicle_image_front_view){
            vehicle.vehicle_image_front_view = req.body.vehicle_image_front_view;
            somethingChanged =true;
        }

        if(req.body.vehicle_image_back_view !== vehicle.vehicle_image_back_view){
            vehicle.vehicle_image_back_view = req.body.vehicle_image_back_view;
            somethingChanged = true;
        }
        if(somethingChanged){
            await vehicle.save();
            const data = _.pick(vehicle, variables.vehicleDetails);
            return responseMessage.success('Vehicle updated successfully!', data, res);
        }        

        const data = _.pick(vehicle, variables.vehicleDetails);
        return responseMessage.success('Nothing to update', data, res);
    },

    assignOrUpdateDriver: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.body.driverId)) return responseMessage.notFound('Invalid driver.', res);
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('The vehicle does not exist.', res);

        let driver = await Driver.findById(req.body.driverId);
        if(!driver) return responseMessage.badRequest('Invalid driver', res);
        if(driver.isApproved == false) return responseMessage.badRequest('The selected driver has not been approved', res);
        if(driver.hasVehicleAssigned == true) return responseMessage.badRequest('The selected driver already has a vehicle', res);

        let vehicle = await Vehicle.findOne({_id: req.params.vehicleId, isDeleted: false});
        if(!vehicle) return responseMessage.notFound('Vehicle does not exist.', res);
        if(req.user._id != vehicle.ownerId) return responseMessage.forbidden('Please consult the vehicle owner.', res);
        if(vehicle.isApproved == false) return responseMessage.badRequest('This vehicle has not been approved', res);

        const oldDriverId = vehicle.driverId;

        vehicle.driverId = req.body.driverId;    
        await vehicle.save();

        if(oldDriverId){
            // update oldDriver
            const oldDriver = await Driver.findById(oldDriverId);
            oldDriver.vehicleId = null;
            oldDriver.vehicleTypeId = null;
            oldDriver.hasVehicleAssigned = false;
            await oldDriver.save();
        }

        // update new driver 
        driver.vehicleId = vehicle._id;
        driver.vehicleTypeId = vehicle.vehicleTypeId;
        driver.hasVehicleAssigned = true;
        await driver.save();

        //to do ===> notify driver on mail or push notification or sms

        vehicle = _.pick(vehicle, variables.vehicleDetails);
        return responseMessage.success('Driver added successfully!', vehicle, res);
    },

    removeDriverFromVehicle: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('The vehicle does not exist.', res);

        let vehicle = await Vehicle.findOne({_id: req.params.vehicleId, isDeleted: false});
        if(!vehicle) return responseMessage.notFound('Vehicle does not exist.', res);
        if(!vehicle.driverId) return responseMessage.notFound('This vehicle does not have a driver.', res);
        if(req.user._id != vehicle.ownerId) return responseMessage.forbidden('Please consult the vehicle owner.', res);
        if(vehicle.isApproved == false) return responseMessage.badRequest('This vehicle has not been approved', res);

        const driverId = vehicle.driverId;
        vehicle.driverId = null;    
        await vehicle.save();

        const driver = await Driver.findById(driverId);
        if(driver){
            driver.vehicleId = null;
            driver.vehicleTypeId = null;
            driver.hasVehicleAssigned = false;
            await driver.save();
        }

        //to do ===> notify driver on mail or push notification or sms

        vehicle = _.pick(vehicle, variables.vehicleDetails);
        return responseMessage.success('Driver removed successfully!', vehicle, res);
    },

    delete: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('The vehicle does not exist.', res);
        let vehicle = await Vehicle.findOne({_id: req.params.vehicleId, isDeleted: false});
        if(!vehicle) return responseMessage.notFound('Vehicle not found.', res);
        if(req.user._id != vehicle.ownerId) return responseMessage.forbidden('You are not allowed to delete this vehicle', res);

        vehicle.isDeleted = true;
        vehicle.deletedAt = Date.now();
        await vehicle.save();

        if(vehicle.driverId){
            const driver = await Driver.findById(vehicle.driverId);
            if(driver){
                driver.vehicleId = null;
                driver.vehicleTypeId = null;
                driver.hasVehicleAssigned = false;
                await driver.save();
            }
        }

        return responseMessage.success('vehicle deleted sucessfully!', null, res);
    },

    fetchApprovedDriversWithoutVehicle: async (req, res) => {
        const drivers = await Driver.find({isApproved: true, hasVehicleAssigned: false}).select(variables.driverDetails);
        if(drivers.length == 0) return responseMessage.notFound('Sorry, no drivers found.', res);

        return responseMessage.success('Listing all available drivers', drivers, res);
    },

    getDriverDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessage.notFound('This driver does not exist.', res);
        let driver = await Driver.findOne({_id: req.params.driverId}).select(variables.driverDetails);
        if(!driver) return responseMessage.notFound('The driver does not exist.', res);

        return responseMessage.success('driver retrieved sucessfully!', driver, res);
    }
};

module.exports = vehicle;