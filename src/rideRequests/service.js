const _ = require('lodash'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    helpers = require('../helpers/subroutines'),
    paymentHandler = require('../helpers/globalPaymentHandler'),
    pushNotification = require('../helpers/firebase-config'),
    mongoose = require('mongoose'),
    { RideRequest } = require('./model'),
    {EstimatedPrice} = require('./estimatedPrice'),
    { Driver } = require('../drivers/model'),
    { Customer } = require('../customers/model'),
    { VehicleType } = require('../vehicleTypes/model'),
    { CurrencyExchangeRate } = require('../admins/currencyModel'),
{ Vehicle } = require('../vehicles/model');

module.exports = {
    requestRide: async (req, res) => {
        const { error } = validate.rideRequest(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );
        
        if (!mongoose.Types.ObjectId.isValid(req.body.vehicleTypeId)) return responseMessage.badRequest('Invalid vehicle type.', res);
        const vehicleType = await VehicleType.findById(req.body.vehicleTypeId);
        if(!vehicleType) return responseMessage.badRequest('Invalid vehicle type.', res);
        const customer = await Customer.findById(req.user._id);
        const vehicle = await Vehicle.findOne({plate_number: req.body.vehicle_plate_number});

        const rideRequest = new RideRequest(_.pick(req.body, variables.rideRequestFullDetails));
        if(vehicle) rideRequest.vehicleId = vehicle._id;
        const matrixData = await helpers.getDistanceAndTime(rideRequest.pickup_coordinates, rideRequest.destination_coordinates);
        createRideRequest(rideRequest, matrixData, req, customer.currency);

        // get all online drivers within a pickup area.
        let radius = 5000;  // 5000 meters i.e. 5 km radius
        let drivers = await helpers.getDriversInPickUpArea(rideRequest, radius, req, res);
        if(drivers.length === undefined) return;

        const driverDeviceId = [], message = {},  pushNotificationData = {};        
        drivers.forEach(driver => {
            if(driver.deviceId !== null && driver.deviceId !== undefined) driverDeviceId.push(driver.deviceId);
        });
        
        message.title = "You have a new ride request";
        message.body = "Kindly click this notification bar to view and accept.";

        pushNotificationData.rideRequestId = rideRequest.id;
        pushNotification.sendNotification(driverDeviceId, message, pushNotificationData);

        const rideRequestData = _.pick(rideRequest, variables.rideRequestDetails);
        return responseMessage.created( 'Ride request created!', rideRequestData, res );
    },

    fetchRideRequest: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        const rideRequest = await RideRequest.findById(req.params.rideRequestId).select(variables.rideRequestDetails);
        if(!rideRequest) return responseMessage.notFound('This ride request does not exist.', res);

        // get driver's location and calculate distance and time to get to pickup location
        const driver = await Driver.findById(req.user._id),
            matrixData = await helpers.getDistanceAndTime(driver.driver_coordinates, rideRequest.pickup_coordinates),
            data = {}, driverMetrics = {};
        driverMetrics.driverDistance = matrixData.distance;
        driverMetrics.driverEstimatedTimeOfArrival = matrixData.duration;

        let customer = await Customer.findById(rideRequest.customerId);
        customer = _.pick(customer, ['firstName', 'lastName', 'firstName', 'profile_picture', 'phone']);

        data.rideRequest = rideRequest;
        data.driverMetrics = driverMetrics;
        data.customerDetails = customer;

        return responseMessage.success('Showing the details of the requested ride request', data, res);
    },

    fetchUserRideRequests: async (req, res) => {
        const rideRequests = await RideRequest.find({ customerId: req.user._id }).select(variables.rideRequestDetails).sort({createdAt: -1});
        if(rideRequests.length == 0 ) return responseMessage.notFound("You haven't made any ride requests yet.", res);

        return responseMessage.success("Listing a user's ride requests", rideRequests, res);
    },

    fetchSingleRideRequestDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        const rideRequest = await RideRequest.findById(req.params.rideRequestId).select(variables.rideRequestDetails);

        if(!rideRequest) return responseMessage.notFound('Ride request not found.', res);
        if(rideRequest.customerId != req.user._id) return responseMessage.forbidden('Unauthorized request.', res);

        return responseMessage.success("Ride request details.", rideRequest, res);
    },

    acceptRideRequest: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        const driver = await Driver.findById(req.user._id);
        if(!driver.isApproved || !driver.hasVehicleAssigned || !driver.isOnline)
            return responseMessage.unauthorized('Sorry, you are not eligible to accept this ride request.', res);
            
        const rideRequest = await RideRequest.findById(req.params.rideRequestId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.driverId != null) return responseMessage.badRequest('Sorry, this ride request is already taken.', res);
        if(rideRequest.trip_status != 'Pending') return responseMessage.badRequest('Sorry, this ride request is no longer active.', res);

        const vehicle = await Vehicle.findOne({driverId: req.user._id, isDeleted: false}); 
        if(!vehicle) return responseMessage.notFound("Sorry, you are not eligible to accept this ride request.", res);

        rideRequest.driverId = req.user._id;
        rideRequest.vehicle_plate_number = vehicle.plate_number;
        rideRequest.vehicleId = vehicle._id;
        rideRequest.trip_status = 'Pending';
        await rideRequest.save();

        driver.isOnATrip = true;
        await driver.save();

        let customer = await Customer.findById(rideRequest.customerId); 
        const  message = [], data = {};
        
        message.title = "A driver accepted your ride request";
        message.body = "Kindly wait for your driver's arrival.";

        //get driver ETA (Estimated time of arrival) 
        const matrixData = await helpers.getDistanceAndTime(driver.driver_coordinates, rideRequest.pickup_coordinates);

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
        return responseMessage.success('Ride request accepted successfully!.', customer, res);        
    },

    startTrip: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        let rideRequest = await RideRequest.findById(req.params.rideRequestId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.driverId != req.user._id) return responseMessage.forbidden('Forbidden.', res);
        if(rideRequest.trip_status != 'Pending') return responseMessage.badRequest('You can not start this trip.', res);

        rideRequest.trip_status = 'InProgress';
        rideRequest.trip_started_at = Date.now();
        rideRequest = await rideRequest.save();
        rideRequest = _.pick(rideRequest, variables.rideRequestDetails);

        // notify customer
        const customer = await Customer.findById(rideRequest.customerId);
        const message = {}, data = {};
        data.tripStatus = rideRequest.trip_status;

        message.title = "Your trip has started.";
        message.body = "Have a safe journey.";
        //send push notification
        pushNotification.sendNotification(customer.deviceId, message, data);

        return responseMessage.success('Trip started. Have a safe journey.', rideRequest, res);
    },

    fetchDriverTripHistory: async (req, res) => {
        const rideRequests = await RideRequest.find({ driverId: req.user._id }).select(variables.rideRequestDetails).sort({createdAt: 'desc'});
        if(rideRequests.length == 0) return responseMessage.notFound('No trips found.', res);

        return responseMessage.success("Showing a driver's trip history", rideRequests, res);
    },

    fetchVehicleTripHistory: async (req, res) => {
        const rideRequests = await RideRequest.find({ vehicleId: req.params.vehicleId })
        .populate('customerId', ['firstName', 'lastName'])
        .select(variables.rideRequestDetails).sort({createdAt: 'desc'});
        if(rideRequests.length == 0) return responseMessage.notFound('No trips found.', res);

        return responseMessage.success("Showing a vehicle's trip history", rideRequests, res);
    },


    fetchOngoingTrips: async (req, res) => {
        const ongoingTrips = await RideRequest.find({ driverId: req.user._id, trip_status: 'InProgress' }).select(variables.rideRequestDetails);
        if(ongoingTrips.length == 0) return responseMessage.notFound('You have no ongoing trips.', res);

        return responseMessage.success('Showing your ongoing trips.', ongoingTrips, res);
    },

    cancelTripIfNoDriverFound: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        
        const rideRequest = await RideRequest.findById(req.params.rideRequestId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.customerId != req.user._id) return responseMessage.forbidden('Forbidden.', res);
        if(rideRequest.trip_status != 'Pending') return responseMessage.badRequest('You can not cancel this trip.', res);
        if(rideRequest.driverId) return responseMessage.badRequest('You can not cancel this trip because a driver has accepted your request.', res);

        rideRequest.trip_status = 'Cancelled';
        rideRequest.final_amount = 0;
        await rideRequest.save();

        return responseMessage.success('Trip cancelled successfully.', rideRequest, res);
    },

    /* 
        **TO DO** add payment debit on trip cancellation (debit customer's wallet)
        Airtel Money, Cash, Airtel Money, Orange, and Mpesa(done)

        Handle insufficient balance
    */
    cancelTrip: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        
        let rideRequest = await RideRequest.findById(req.params.rideRequestId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.driverId != req.user._id) return responseMessage.forbidden('Forbidden.', res);
        if(rideRequest.trip_status != 'Pending') return responseMessage.badRequest('You can not cancel this trip.', res);

        // debit customer 1 dollar trip cancellation fee
        const customer = await Customer.findById(rideRequest.customerId);
        if(rideRequest.modeOfPayment === 'Mpesa') {
            let tripCancellationCharge = 1;
            if(rideRequest.currency !== 'USD') {
                const currencyRate = await CurrencyExchangeRate.findOne({currency: rideRequest.currency});
                tripCancellationCharge = 1 * currencyRate.approvedRate;
            }
            const mpesaPayment = await paymentHandler.mpesa(customer.phone, tripCancellationCharge, rideRequest.currency);
            if(mpesaPayment.status) return responseMessage.badRequest('Could not complete request', res);

            rideRequest.final_amount = tripCancellationCharge;
            rideRequest.paymentStatus = 'Paid';
            rideRequest.isPaymentConfirmed = true;
            rideRequest.payment_confirmed_at = Date.now();
        }

        rideRequest.trip_status = 'Cancelled';
        await rideRequest.save();

        if(rideRequest.driverId) {
            const driver = await Driver.findById(rideRequest.driverId);
            driver.isOnATrip = false;
            await driver.save();
        }

        // notify customer
        const message = {}, data = {};
        data.rideRequestId = rideRequest.id;

        message.title = "Your trip was cancelled.";
        message.body = "Kindly click this notification to view details.";
        rideRequest = _.pick(rideRequest, variables.rideRequestDetails);

        //send push notification
        pushNotification.sendNotification(customer.deviceId, message, data);
        return responseMessage.success('Trip cancelled successfully.', rideRequest, res);
    },

    /* 
        **TO DO** debit the amount from the customer's preferred payment mode
        Airtel Money, Cash, Airtel Money, Orange, and Mpesa(done)

        Handle cash payment .. maybe provide an API for that
        Handle insufficient balance
    */
    endTrip: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.rideRequestId)) return responseMessage.notFound('Invalid ride request.', res);
        const rideRequest = await RideRequest.findById(req.params.rideRequestId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.driverId != req.user._id) return responseMessage.forbidden('Forbidden.', res);  // if user is not the driver for the trip.
        if(rideRequest.trip_status != 'InProgress') return responseMessage.badRequest('You can not end this trip.', res);
        
        const currentTime = Date.now();
        const timeMatrix = helpers.calculateFinalTripDuration(rideRequest.trip_started_at, currentTime);
        const matrixData = await helpers.getDistanceAndTime(rideRequest.pickup_coordinates, req.body.driver_coordinate);

        // make payment
        const customer = await Customer.findById(rideRequest.customerId);
        const tripAmount = await helpers.calculateTripAmount(matrixData.distanceValue, timeMatrix.durationValue, rideRequest.currency);
        
        let paymentWasMade = false;
        if(rideRequest.modeOfPayment === 'Mpesa') {
            const mpesaPayment = await paymentHandler.mpesa(customer.phone, tripAmount, rideRequest.currency);
            if(mpesaPayment.status){
                paymentWasMade = true;

                rideRequest.paymentStatus = 'Paid';
                rideRequest.isPaymentConfirmed = true;
                rideRequest.payment_confirmed_at = Date.now();
            }
        }

        if(rideRequest.modeOfPayment == 'Cash'){
            paymentWasMade = true;

            rideRequest.paymentStatus = 'Paid';
            rideRequest.isPaymentConfirmed = true;
            rideRequest.payment_confirmed_at = Date.now();
        }
        rideRequest.trip_status = 'Ended';
        rideRequest.trip_ended_at = currentTime;
        rideRequest.final_duration = timeMatrix.duration;
        rideRequest.final_durationValue = timeMatrix.durationValue;
        rideRequest.final_distanceValue = matrixData.distanceValue;
        rideRequest.final_distance = matrixData.distance;
        rideRequest.final_amount = tripAmount;
        rideRequest.isPaymentConfirmed = false;
        rideRequest.save();

        const driver = await Driver.findById(rideRequest.driverId);
        driver.isOnATrip = false;
        await driver.save();

        // notify customer
        const message = {}, data = {};
        data.rideRequestId = req.params.rideRequestId;
        message.title = "Your trip has ended.";
        message.body = "Kindly click this notification to view details.";
        pushNotification.sendNotification(customer.deviceId, message, data);

        const rideRequestData = _.pick(rideRequest, variables.rideRequestDetails);
        if(paymentWasMade) return responseMessage.success('Trip ended successfully. Have a nice day.', rideRequestData, res);
        return responseMessage.partialContent('Could not make payment please try other payment method.', rideRequestData, res);
    },

    getDriverPicture: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessage.notFound('Invalid driver.', res);

        const driver = await Driver.findById(req.params.driverId).select('profile_picture');
        if(!driver) return responseMessage.badRequest('Invalid driver.', res);
        if(driver.profile_picture === null || driver.profile_picture === undefined) return responseMessage.notFound('This driver does not have a profile picture.', res);
        
        return responseMessage.success('Showing driver image', driver, res);
    },

    //used to test push notification
    testNotification: async (req, res) => {
        const message = {};
        message.body = req.body.message;
        message.title = "You have a new ride request";
        const data = {};
        data.rideRequestId = req.body.token;

        pushNotification.sendNotification(req.body.token, message, data);
        return res.send("SMS sent successfully!");
    },

    // used to test payment global service
    testPayment: async (req, res) => {
        const paymentStatus = await paymentHandler.mpesa(req.body.phone, req.body.amount, null);
        return res.send(paymentStatus);
    },

    getEstimatedTripAmount: async (req, res) => {
       
        const rideRequest = new EstimatedPrice(_.pick(req.body, variables.rideRequestFullDetails));

        const matrixData = await helpers.getDistanceAndTime(rideRequest.pickup_coordinates, rideRequest.destination_coordinates);
   
        const tripAmountDolar = await helpers.calculateTripAmount(matrixData.distanceValue, matrixData.durationValue, "USD");
        const tripAmountInNaira = await helpers.calculateTripAmount(matrixData.distanceValue, matrixData.durationValue, "NGN");

        var prices = [
            {"EstimatedPrice":tripAmountDolar, "CurrencyType":"USD"},
            {"EstimatedPrice":tripAmountInNaira, "CurrencyType":"NGN"}
            ];

        return responseMessage.success("Listing estimated prices", prices, res);
     

    },


};

async function createRideRequest(rideRequest, matrixData, req, currency) {
    rideRequest.calculated_distance = matrixData.distance;
    rideRequest.calculated_raw_distance = matrixData.distanceValue;
    rideRequest.calculated_duration = matrixData.duration;
    rideRequest.calculated_raw_duration = matrixData.durationValue;
    rideRequest.rideOrderId = helpers.generateRideOrderId();
    rideRequest.customerId = req.user._id;
    rideRequest.vehicleTypeId = req.body.vehicleTypeId;
    rideRequest.calculated_amount = req.body.tripAmount;
    rideRequest.modeOfPayment = req.body.payment_mode;
    rideRequest.currency = currency;
    return rideRequest.save();
}