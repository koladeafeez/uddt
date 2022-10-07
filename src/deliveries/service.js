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
          vehicleTypes = await VehicleType.find({loadCapacity: { $lte: 2500}}).sort({loadCapacity})
           .select(variables.vehicleTypeDetails).exec();

        }else if(req.body.itemCategory == "large")
        {
            // return car only
             vehicleTypes = await VehicleType.find({loadCapacity: {  $gt : 1000,$lte: 2500}}).sort({loadCapacity})
            .select(variables.vehicleTypeDetails).exec();

        }else
        {
            // return car and truck
             vehicleTypes = await VehicleType.find({loadCapacity: { $gte: 2500}}).sort({loadCapacity})
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
            pushNotification.sendNotification(driverDeviceId, message, pushNotificationData);


            const deliveryRequestData = _.pick(deliveryRequest, variables.deliveryRequestDetails);
            return responseMessage.created( 'Ride request created!', deliveryRequestData, res );
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