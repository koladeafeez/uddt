const _ = require('lodash'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    helpers = require('../helpers/subroutines'),
    paymentHandler = require('../helpers/globalPaymentHandler'),
    pushNotification = require('../helpers/firebase-config'),
    mongoose = require('mongoose'),
    { DeliveryRequest } = require('./model'),
    { Driver } = require('../drivers/model'),
    { Customer } = require('../customers/model'),
    { VehicleType } = require('../vehicleTypes/model'),
    { CurrencyExchangeRate } = require('../admins/currencyModel'),
{ Vehicle } = require('../vehicles/model');

module.exports = {
    initiateDelivery: async (req, res) => {
        const { error } = validate.deliveryRequest(req.body); 
        if(error) return responseMessage.badRequest( error.details[0].message, res );
        

        const customer = await Customer.findById(req.user._id);

        const deliveryRequest = new DeliveryRequest(_.pick(req.body, variables.deliveryRequestFullDetails));

        const matrixData = await helpers.getDistanceAndTime(deliveryRequest.pickup_coordinates, deliveryRequest.destination_coordinates);
        var rideOrderId = helpers.generateRideOrderId();
        createDeliveryRequest(deliveryRequest, matrixData, req, customer.currency,rideOrderId);

        // calculate suitable vehicle

        // check if the delivery a small packages and quantity

        var vehicleTypes = undefined;


        if(req.body.itemCategory == "small/medium")
        {
           // return bike and car
          vehicleTypes = await VehicleType.find({loadCapacity:{$lte:2500}})
           .select(variables.vehicleTypeDetails).exec();

        }else if(req.body.itemCategory == "large")
        {
            // return car only
             vehicleTypes = await VehicleType.find({loadCapacity: {  $gt : 1000,$lte: 2500}})
            .select(variables.vehicleTypeDetails).exec();

        }else
        {
            // return car and truck
             vehicleTypes = await VehicleType.find({loadCapacity: { $gte: 2500}})
            .select(variables.vehicleTypeDetails).exec();
        }


        if(vehicleTypes == undefined || vehicleTypes == null || vehicleTypes.length == 0)
            return responseMessage.internalServerError(res);

         
            var data = {
                "deliveryOrderId": rideOrderId,
                "vehicleTypes": vehicleTypes
            }

       return responseMessage.success("Delivery booking request in progress", data, res);     
    },


    continueDeliveryRequest : async (req, res) => {
        
        if(req.params.deliveryOrderId == undefined || req.params.deliveryOrderId == null)
            return responseMessage.badRequest("deliveryOrderId is required", res);
        

        var deliveryRequest = await DeliveryRequest.findOne({deliveryOrderId: req.params.deliveryOrderId}).exec();

        if(deliveryRequest == null)
            return responseMessage.notFound("Delivery Not Found", res);

            if (!mongoose.Types.ObjectId.isValid(req.body.vehicleTypeId)) return responseMessage.badRequest('Invalid vehicle type.', res);
            const vehicleType = await VehicleType.findById(req.body.vehicleTypeId);
            if(!vehicleType) return responseMessage.badRequest('Invalid vehicle type.', res);       


            deliveryRequest.vehicleTypeId = req.body.vehicleTypeId;
            deliveryRequest.save();

        // Calculate Estimated price
         const matrixData = await helpers.getDistanceAndTime(deliveryRequest.pickup_coordinates, deliveryRequest.destination_coordinates);
   
        const tripAmountDolar = await helpers.calculateTripAmount(matrixData.distanceValue, matrixData.durationValue, "USD");
        const tripAmountInNaira = await helpers.calculateTripAmount(matrixData.distanceValue, matrixData.durationValue, "NGN");

        var prices = [
            {"EstimatedPrice":tripAmountDolar, "CurrencyType":"USD"},
            {"EstimatedPrice":tripAmountInNaira, "CurrencyType":"NGN"}
            ];

            deliveryRequest.calculated_amount = tripAmountDolar;
    
            const deliveryRequestData = _.pick(deliveryRequest, variables.deliveryRequestDetails);
            return responseMessage.created( 'Delivery request in Progress!', deliveryRequestData, res );    

    },

    completeDeliveryRequest: async (req, res) => {

        if(req.params.deliveryOrderId == undefined || req.params.deliveryOrderId == null)
        return responseMessage.badRequest("deliveryOrderId is required", res);
    

    var deliveryRequest = await DeliveryRequest.findOne({deliveryOrderId: req.params.deliveryOrderId}).exec();

    if(deliveryRequest == null)
    return responseMessage.notFound("Delivery Not Found", res);

    if(deliveryRequest.vehicleTypeId == null || !mongoose.Types.ObjectId.isValid(deliveryRequest.vehicleTypeId))
        return responseMessage.badRequest("Incomplete Request, Select Vehicle Type Before Continue");

    
    const vehicleType = await VehicleType.findById(deliveryRequest.vehicleTypeId);
    if(!vehicleType) return responseMessage.badRequest('Invalid vehicle type.', res);       


    let radius = 5000;  // 5000 meters i.e. 5 km radius
            let drivers = await helpers.getDriversInPickUpArea(deliveryRequest, radius, req, res);
            if(drivers.length === undefined) return;
    
            const driverDeviceId = [], message = {},  pushNotificationData = {};        
            drivers.forEach(driver => {
                if(driver.deviceId !== null && driver.deviceId !== undefined) driverDeviceId.push(driver.deviceId);
            });
            
            message.title = "You have a new Delivery request";
            message.body = "Kindly click this notification bar to view and accept.";
    
            pushNotificationData.deliveryRequestId = deliveryRequest.id;
            pushNotificationData.requestType = "delivery";
            pushNotification.sendNotification(driverDeviceId, message, pushNotificationData);


            const deliveryRequestData = _.pick(deliveryRequest, variables.deliveryRequestDetails);
            return responseMessage.created( 'Delivery request created!', deliveryRequestData, res );
    },
    
    fetchUserDeliveryRequests: async (req, res) => {
        const rideRequests = await DeliveryRequest.find({ customerId: req.user._id }).select(variables.rideRequestDetails).sort({createdAt: -1});
        if(rideRequests.length == 0 ) return responseMessage.notFound("You haven't made any delivery requests yet.", res);

        return responseMessage.success("Listing a Deliveries ride requests", rideRequests, res);
    },

    fetchSingleDeliveryRequestDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.deliveryRequestId)) return responseMessage.notFound('Invalid delivery request.', res);
        const deliveryRequest = await DeliveryRequest.findById(req.params.deliveryRequestId).select(variables.deliveryRequestDetails);

        if(!deliveryRequest) return responseMessage.notFound('Delivery request not found.', res);
        if(deliveryRequest.customerId != req.user._id) return responseMessage.forbidden('Unauthorized request.', res);

        return responseMessage.success("Delivery request details.", deliveryRequest, res);
    },

    acceptDeliveryRequest: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.deliveryRequestId)) return responseMessage.notFound('Invalid delivery request.', res);
        const driver = await Driver.findById(req.user._id);
        if(!driver.isApproved || !driver.hasVehicleAssigned || !driver.isOnline)
            return responseMessage.unauthorized('Sorry, you are not eligible to accept this delivery request.', res);
            
        const deliveryRequest = await DeliveryRequest.findById(req.params.deliveryRequestId);
        if(!deliveryRequest) return responseMessage.notFound('Invalid delivery request.', res);
        if(deliveryRequest.driverId != null || deliveryRequest.driverId != undefined) return responseMessage.badRequest('Sorry, this delivery request is already taken.', res);
        if(deliveryRequest.trip_status != 'Pending') return responseMessage.badRequest('Sorry, this delivery request is no longer active.', res);

        const vehicle = await Vehicle.findOne({driverId: req.user._id, isDeleted: false}); 
        if(!vehicle) return responseMessage.notFound("Sorry, you are not eligible to accept this delivery request.", res);

        deliveryRequest.driverId = req.user._id;
        deliveryRequest.vehicle_plate_number = vehicle.plate_number;
        deliveryRequest.vehicleId = vehicle._id;
        deliveryRequest.trip_status = 'Pending';
        await deliveryRequest.save();

        driver.isOnATrip = true;
        await driver.save();

        let customer = await Customer.findById(deliveryRequest.customerId); 
        const  message = [], data = {};
        
        message.title = "A driver accepted your delivery request";
        message.body = "Kindly wait for your driver's arrival.";

        //get driver ETA (Estimated time of arrival) 
        const matrixData = await helpers.getDistanceAndTime(driver.driver_coordinates, deliveryRequest.pickup_coordinates);

        data.driverName = `${driver.firstName} ${driver.lastName}`;
        data.vehiclePlateNumber = vehicle.plate_number;
        data.vehicleModel = vehicle.vehicle_name;
        data.driverPhone = driver.phone;
        data.driverDistance = matrixData.distance;
        data.driverETA = matrixData.duration;  // ETA is Estimated Time of Arrival 
        data.driverId = req.user._id;

        //send push notification
        pushNotification.sendNotification(customer.deviceId, message, data);

        customer = _.pick(customer,  ['firstName', 'lastName', 'firstName', 'profile_picture', 'phone']);
        return responseMessage.success('Delivery request accepted successfully!.', customer, res);        
    },

    startDelivery: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.deliveryRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        let deliveryRequest = await DeliveryRequest.findById(req.params.deliveryRequestId);
        if(!deliveryRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(deliveryRequest.driverId != req.user._id) return responseMessage.forbidden('Forbidden.', res);
        if(deliveryRequest.trip_status != 'Pending') return responseMessage.badRequest('You can not start this trip.', res);

        deliveryRequest.trip_status = 'InProgress';
        deliveryRequest.trip_started_at = Date.now();
        deliveryRequest = await deliveryRequest.save();
        deliveryRequest = _.pick(deliveryRequest, variables.deliveryRequestDetails);

        // notify customer
        const customer = await Customer.findById(deliveryRequest.customerId);
        const message = {}, data = {};
        data.tripStatus = deliveryRequest.trip_status;

        message.title = "Your Delivery has started.";
        message.body = "Delivery InProgress.";
        //send push notification
        pushNotification.sendNotification(customer.deviceId, message, data);

        return responseMessage.success('Delivery Started and InProgress.', deliveryRequest, res);
    },
    
}

async function createDeliveryRequest(deliveryRequest, matrixData, req, currency, rideOrderId) {
    deliveryRequest.calculated_distance = matrixData.distance;
    deliveryRequest.calculated_raw_distance = matrixData.distanceValue;
    deliveryRequest.calculated_duration = matrixData.duration;
    deliveryRequest.calculated_raw_duration = matrixData.durationValue;
    deliveryRequest.deliveryOrderId = rideOrderId;
    deliveryRequest.customerId = req.user._id;
    deliveryRequest.calculated_amount = req.body.tripAmount;
    deliveryRequest.modeOfPayment = req.body.payment_mode;
    deliveryRequest.currency = currency;
    return deliveryRequest.save();
}