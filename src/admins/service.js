const _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    mailService = require('../helpers/mailServices'),
    helpers = require('../helpers/subroutines'),
    mongoose = require('mongoose'),
    { Driver } = require('../drivers/model'),
    { Customer } = require('../customers/model'),
    { RideRequest } = require('../rideRequests/model'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    { Admin } = require('./model'),
    { CurrencyExchangeRate } = require('./currencyModel'),
    { CurrencyActivity } = require('./currencyActivitiesModel'),
    { CarOwner } = require('../carOwners/model'),
    { Vehicle } = require('../vehicles/model'),
pushNotification = require('../helpers/firebase-config');

module.exports = {
    createAdmin: async (req, res) => {
        const { error } = validate.createAdmin(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const email = await Admin.findOne({ email: req.body.email.toLowerCase() });
        if(email) return responseMessage.badRequest('Email already exists.', res);

        const admin = new Admin(_.pick(req.body, variables.adminDetails));
        admin.country = req.body.country.toLowerCase();  // modify this to use the same country as the creator (i.e. the current req.user)
        admin.email = req.body.email.toLowerCase();
        const salt = await bcrypt.genSalt(10);        
        admin.password = await bcrypt.hash(req.body.password, salt);
        admin.passwordResetToken = helpers.generateEmailVerificationToken(req.body.email);
        admin.passwordResetToken_expires_on = helpers.getCurrentDate.addDays(1);   // expires in 1 day
        await admin.save();

        mailService.sendAdminChangePasswordEmail(admin);
        const data = _.pick(admin, variables.adminDetails);
        return responseMessage.created('The new admin was created successfully!', data, res);
    },

    login: async (req, res) =>{
        const { error } = validate.login(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const admin = await Admin.findOne({email: req.body.email.toLowerCase(), isDeleted: false});
        if (!admin) return responseMessage.badRequest( 'Invalid email or password. You can use the forgot password feature to reset your password.', res );

        const validPassword = await bcrypt.compare(req.body.password, admin.password);
        if (!validPassword) return responseMessage.badRequest( 'Invalid email or password. You can use the forgot password feature to reset your password.', res );

        const data = _.pick(admin, variables.adminDetails);
        const token = helpers.generateAuthToken(admin);

        if (admin.isEmailVerified == true) return responseMessage.successfulLogin( token, 'You have logged in successfully!', data, res );  
        return responseMessage.partialContent( 'Please verify your email address', data, res );
    },

    // currently not in use (Use password reset instead)
    verifyEmail: async (req, res) => {
        let admin = await Admin.findOne({
            email_verification_token: req.params.token, 
            email_verification_token_expires_on:  {$gte: Date.now()},
            isDeleted: false
        });
        if(!admin) return responseMessage.badRequest('Invalid or expired token.', res);

        admin.isEmailVerified = true;
        admin.email_verification_token = null;
        admin.email_verification_token_expires_on = null;
        await admin.save();

        const data = _.pick(admin, variables.adminDetails);
        const token = helpers.generateAuthToken(admin);
        return responseMessage.successfulLogin( token, 'Your email has been verified successfully!.', data, res );
    },    

    // currently not in use..
    regenerateEmailVerificationMail: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );

        const admin = await Admin.findOne({email: req.body.email.toLowerCase(), isDeleted: false});      
        if(!admin) return responseMessage.badRequest( 'Sorry, this email does not exist in our records', res );
        if(admin.isEmailVerified == true) return responseMessage.badRequest( 'You have already verified your email address', res );
        
        admin.email_verification_token = helpers.generateEmailVerificationToken(admin.email);
        admin.email_verification_token_expires_on = helpers.getCurrentDate.addDays(1);  //expires in 1 day
        await admin.save();

        // mailService.sendVerificationEmail(admin);  ***** TO DO ******
        return responseMessage.success('A new verification email has been sent to your email inbox. Please check your mail and follow the instructions therein to confirm your account', null, res);
    },

    updateAdminRole: async(req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.adminId)) return responseMessage.notFound('Invalid user.', res);
        const admin = await Admin.findOne({id: req.params.adminId, isDeleted: false});
        if(!admin) return responseMessage.badRequest('Invalid user.', res);

        admin.role = req.body.role;
        await admin.save();

        const data = _.pick(admin, variables.adminDetails);
        return responseMessage.success('Admin role updated successfully!', data, res);
    },

    delete: async(req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.adminId)) return responseMessage.notFound('Invalid user.', res);
        const admin = await Admin.findOne({ _id: req.params.adminId, isDeleted:false });
        if(!admin) return responseMessage.badRequest('Invalid user.', res);

        admin.isDeleted = true;
        await admin.save();

        return responseMessage.success('Admin deleted successfully!', null, res);
    },

    forgotPassword: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );
        let admin = await Admin.findOne({email: req.body.email.toLowerCase(), isDeleted: false});
        if(!admin) return responseMessage.badRequest( 'Invalid user.', res );

        admin.passwordResetToken = helpers.generateEmailVerificationToken(admin.email);
        admin.passwordResetToken_expires_on = helpers.getCurrentDate.addDays(1);  //expires in 1 day
        await admin.save();
        
        mailService.sendAdminPasswordResetEmail(admin);
        return responseMessage.success('Please check your mail for the details of the next step.', null, res);
    },

    resetPassword: async (req, res) => {
        const { error } = validate.password(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const admin = await Admin.findOne({passwordResetToken: req.params.token, passwordResetToken_expires_on: {$gte: Date.now()} });
        if(!admin) return responseMessage.badRequest('Invalid or expired token', res);

        const salt = await bcrypt.genSalt(10);        
        admin.password = await bcrypt.hash(req.body.password, salt);
        admin.passwordResetToken = null;
        admin.passwordResetToken_expires_on = null;
        admin.needsPasswordReset = false;
        admin.isEmailVerified = true;
        await admin.save();

        const token = helpers.generateAuthToken(admin);
        const data = _.pick(admin, variables.adminDetails);
        return responseMessage.successfulLogin( token, 'Your password has been updated successfully!.', data, res );
    },

    getDriversForApproval: async (req, res) => {
        const drivers = await Driver.find({ isPhoneVerified: true, approvedOrDisapprovedAt: null }).sort({createdAt: -1}).select(variables.driverDetails);
        if(drivers.length === 0) return responseMessage.notFound('No drivers awaiting approval.', res);

        return responseMessage.success('Listing all drivers awaiting approval.', drivers, res);
    },

    approveOrDisapproveDriver: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessage.notFound('Invalid driver.', res);
        const driver = await Driver.findById(req.params.driverId);
        if(!driver) return responseMessage.notFound('Invalid driver', res);
        if(req.body.isApproved == null || req.body.isApproved == undefined) return responseMessage.notFound('isApproved is required.', res);

        driver.isApproved = req.body.isApproved;
        driver.approvedOrDisapprovedBy = req.user._id;
        driver.approvedOrDisapprovedAt = Date.now();
        await driver.save();

        return responseMessage.success('Driver approved or disapproved successfully!.', null, res);
    },


/* =====================================================================
                    UserMananagement
   ===================================================================== */

// Fetch driver details

    getDriverDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessage.notFound('Invalid driver.', res);

        const driver = await Driver.findById(req.params.driverId).populate("Vehicles").select(variables.driverDetails);
        if(!driver) return responseMessage.notFound('Invalid driver', res);

        return responseMessage.success('Showing the details of the selected driver.', driver, res);
    },

// fetch paginated Approved Drivers

    getApprovedDrivers: async (req, res) => {
        const { page = 1, limit = 20 } = req.query;
//.
        try {
        const posts = await Driver.find({ isApproved: true }).select(variables.driverDetails)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();



        const count = await Driver.find({ isApproved: true }).countDocuments();

        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };

        return responseMessage.success('Listing all approved drivers.', data, res);

        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");

        }


    },

// Fetch Paginated Previous RideRequest
getDriverPastRides: async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.params.driverId)) return responseMessage.notFound('Invalid driverId.', res);
    const driver = await Driver.findById(req.params.driverId);
    if(!driver) return responseMessage.notFound('Driver Not Found', res);

    try {
    const posts = await RideRequest.find({driverId : req.params.driverId, trip_status : "Ended", createdAt: {
        $gte: startDate, 
        $lt: endDate
    }}).populate('customerId', ['firstName', 'lastName'])
    .sort({createdAt: -1}).select(variables.customerPreviousRideAdminView)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();



    const count = await RideRequest.find({driverId : req.params.driverId, trip_status : "Ended", createdAt: {
        $gte: startDate, 
        $lt: endDate
    }}).countDocuments();

    var data ={
        posts,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };

    return responseMessage.success('Listing previous rides.', data, res);

    } catch (err) {
    
        return responseMessage.internalServerError("An Error Occur While Fetching Data");

    }


},


// Fetch Paginated CarOwners
    getAllCarOwners: async (req, res) => {
        const { page = 1, limit = 20 } = req.query;

        try {
        const posts = await CarOwner.find().sort({createdAt: -1}).select(variables.carOwnerDetails)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await CarOwner.find().sort({createdAt: -1}).countDocuments();

        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };

        return responseMessage.success('Listing carOwners.', data, res);

        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");

        }


    },

    // Fetch Single CarOwner Details
    getCarOwnerDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.carOwnerId)) return responseMessage.notFound('Invalid carOwner.', res);

        const carOwner = await CarOwner.findById(req.params.carOwnerId).select(variables.carOwnerDetails);
        if(!carOwner) return responseMessage.notFound('Invalid carOwner', res);

        return responseMessage.success('Showing the details of the selected carOwner.', carOwner, res);
    },

// fetch CarOwner Vehicles
    getCarOwnerVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.params.carOwnerId, isDeleted: false}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("No vehicles found", res);

        return responseMessage.success('Displaying all cars registered by the selected carOwner.', vehicles, res);
    },

    // Fetch All Customers
    getAllCustomer: async (req, res) => {
        const { page = 1, limit = 20 } = req.query;

        try {
        const posts = await Customer.find({ email:{$ne:null}, isPhoneVerified : true, password: {$ne: null}}).sort({createdAt: -1}).select(variables.adminViewDetails)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Customer.find({ email:{$ne:null}, isPhoneVerified : true, password: {$ne: null}}).countDocuments();

        var data ={
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        };

        return responseMessage.success('Listing customers.', data, res);

        } catch (err) {
        
            return responseMessage.internalServerError("An Error Occur While Fetching Data");

        }


    },


    getCustomerDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.customerId)) return responseMessage.notFound('Invalid customer.', res);

        const customer = await Customer.findById(req.params.customerId).select(variables.customerDetails);
        if(!customer) return responseMessage.notFound('Invalid customer', res);

        return responseMessage.success('Showing the details of the selected customer.', customer, res);
    },


// Fetch Paginated Customer Previous RideRequest
getCustomerPastRides: async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const {startDate = new Date('0001-01-01T00:00:00Z'), endDate = Date.now()} = req.query;

    if (!mongoose.Types.ObjectId.isValid(req.params.customerId)) return responseMessage.notFound('Invalid customerId.', res);
    const driver = await Customer.findById(req.params.customerId);
    if(!driver) return responseMessage.notFound('Customer Not Found', res);

    try {
    const posts = await RideRequest.find({customerId : req.params.customerId, trip_status : "Ended", createdAt: {
        $gte: startDate, 
        $lt: endDate
    }}).populate('driverId', ['firstName', 'lastName'])
    .sort({createdAt: -1}).select(variables.customerPreviousRideAdminView)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

    const count = await RideRequest.find({customerId : req.params.customerId, trip_status : "Ended", createdAt: {
        $gte: startDate, 
        $lt: endDate
    }}).countDocuments();

    var data ={
        posts,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    };

    return responseMessage.success('Listing previous rides.', data, res);

    } catch (err) {
    
        return responseMessage.internalServerError("An Error Occur While Fetching Data");

    }


},




    /* =====================================================================
                   End UserMananagement
   ===================================================================== */




    getDisapprovedDrivers: async (req, res) => {
        const drivers = await Driver.find({ isApproved: false }).select(variables.driverDetails);
        if(drivers.length == 0) return responseMessage.notFound('No drivers found', res);

        return responseMessage.success('Listing all disapproved drivers.', drivers, res);
    },

    getAllDrivers: async (req, res) => {
        const drivers = await Driver.find({password: {$ne: null}}).sort({createdAt: -1}).select(variables.driverDetails);
        if(drivers.length == 0) return responseMessage.notFound('No drivers found', res);

        return responseMessage.success('Listing all drivers.', drivers, res);
    },

    getVehiclesForApproval: async (req, res) => {
        const vehicles = await Vehicle.find({ approvedOrDisapprovedAt: null, isDeleted: false }).sort({createdAt: -1}).select(variables.vehicleDetails);
        if(vehicles.length === 0) return responseMessage.notFound('No vehicles awaiting approval.', res);

        return responseMessage.success('Listing all vehicles awaiting approval.', vehicles, res);
    },

    getVehicleDetails: async(req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('Invalid vehicle.', res);

        const vehicle = await Vehicle.findById(req.params.vehicleId).select(variables.vehicleDetails);
        if(!vehicle) return responseMessage.notFound('Invalid vehicle', res);

        return responseMessage.success('Showing the details of the selected vehicle.', vehicle, res);
    },

    approveOrDisapproveVehicle: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.vehicleId)) return responseMessage.notFound('Invalid vehicle.', res);
        const vehicle = await Vehicle.findById(req.params.vehicleId);
        if(!vehicle) return responseMessage.notFound('Invalid vehicle', res);
        if(req.body.isApproved == null || req.body.isApproved == undefined) return responseMessage.notFound('isApproved is required.', res);

        vehicle.isApproved = req.body.isApproved;
        vehicle.approvedOrDisapprovedBy = req.user._id;
        vehicle.approvedOrDisapprovedAt = Date.now();
        await vehicle.save();

        return responseMessage.success('Vehicle approved or disapproved successfully!.', null, res);
    },

    getApprovedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ isApproved: true, isDeleted: false }).sort({createdAt: -1}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound('No vehicles found', res);

        return responseMessage.success('Listing all approved vehicles.', vehicles, res);
    },

    getDisapprovedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ isApproved: false, isDeleted: false }).sort({createdAt: -1}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound('No vehicles found', res);

        return responseMessage.success('Listing all disapproved vehicles.', vehicles, res);
    },

    getAllVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ isDeleted: false }).sort({createdAt: -1}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound('No vehicles found', res);

        return responseMessage.success('Listing all vehicles.', vehicles, res);
    },



    getCarOwnerVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.params.carOwnerId, isDeleted: false}).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("No vehicles found", res);

        return responseMessage.success('Displaying all cars registered by the selected carOwner.', vehicles, res);
    },

    getCarOwnersApprovedVehicles: async (req, res) => {
        if(!mongoose.Types.ObjectId.isValid(req.params.carOwnerId)) return responseMessages.badRequest('Invalid car owner', res);

        const approvedVehicles = await Vehicle.find({ isDeleted: false, ownerId: req.params.carOwnerId, isApproved: true}).select(variables.vehicleDetails);
        if(approvedVehicles.length == 0) return responseMessage.notFound("No approved vehicles found", res);

        return responseMessage.success('Displaying all approved cars registered by the selected car owner.', approvedVehicles, res);
    },

    getCarOwnersDisapprovedVehicles: async (req, res) => {
        if(!mongoose.Types.ObjectId.isValid(req.params.carOwnerId)) return responseMessages.badRequest('Invalid car owner', res);

        const disapprovedVehicles = await Vehicle.find({ isDeleted: false, ownerId: req.params.carOwnerId, isApproved: false, approvedOrDisapprovedBy: {$ne: null} }).select(variables.vehicleDetails);
        if(disapprovedVehicles.length == 0) return responseMessage.notFound("No disapproved vehicles found", res);

        return responseMessage.success('Displaying all disapproved cars registered by the selected car owner.', disapprovedVehicles, res);
    },

    getCarOwnersPendingVehicles: async (req, res) => {
        if(!mongoose.Types.ObjectId.isValid(req.params.carOwnerId)) return responseMessages.badRequest('Invalid car owner', res);

        const pendingVehicles = await Vehicle.find({ isDeleted: false, ownerId: req.params.carOwnerId, isApproved: false, approvedOrDisapprovedBy: null }).select(variables.vehicleDetails);
        if(pendingVehicles.length == 0) return responseMessage.notFound("No vehicles awaiting approval found", res);

        return responseMessage.success('Displaying all vehicles registered by the selected car owner currently awaiting approval.', pendingVehicles, res);
    },


    getAllAdmins: async (req, res) => {
        const admins = await Admin.find({ isDeleted: false }).select(variables.adminDetails);
        if(admins.length == 0) return responseMessage.notFound('No admins found', res);

        return responseMessage.success('Listing all admins.', admins, res);
    },

    getSingleAdmin: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.adminId)) return responseMessage.notFound('Invalid admin.', res);

        const admin = await Admin.findById(req.params.adminId).select(variables.adminDetails);
        if(!admin) return responseMessage.notFound('Invalid admin', res);

        return responseMessage.success('Showing the details of the selected admin.', admin, res);
    },

    getTripDetails: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.tripId)) return responseMessage.notFound('Invalid trip.', res);

        const trip = await RideRequest.findById(req.params.tripId).select(variables.rideRequestDetails);
        if(!trip) return responseMessage.notFound('Invalid trip', res);

        return responseMessage.success('Showing the details of the selected trip.', trip, res);
    },

    getTripsInProgress: async (req, res) => {
        const trips = await RideRequest.find({trip_status: 'InProgress'}).select(variables.rideRequestDetails);
        if(trips.length == 0) return responseMessage.notFound('No ongoing trips', res);

        return responseMessage.success('Listing all trips in progress', trips, res);
    },

    /* 
        **TO DO** debit the amount from the customer's preferred payment mode
        Airtel Money, Cash, Airtel Money, Orange, and Mpesa(done)

        Handle cash payment .. maybe provide an API for that
        Handle insufficient balance
        handle weeekly settlement between drivers, carOwners and the system
    */
    endTrip: async (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.tripId)) return responseMessage.notFound('Invalid ride request.', res);
        const rideRequest = await RideRequest.findById(req.params.tripId);
        if(!rideRequest) return responseMessage.notFound('Invalid ride request.', res);
        if(rideRequest.trip_status != 'InProgress') return responseMessage.badRequest('You can not end this trip.', res);
        
        const currentTime = Date.now();
        const timeMatrix = helpers.calculateFinalTripDuration(rideRequest.trip_started_at, currentTime);
        const matrixData = await helpers.getDistanceAndTime(rideRequest.pickup_coordinates, req.body.driver_coordinate);
        const tripAmount =helpers.calculateTripAmount(matrixData.distanceValue, timeMatrix.durationValue);

        // debit customer
        const customer = await Customer.findById(rideRequest.customerId);
        if(rideRequest.modeOfPayment === 'Mpesa') {
            // get customers's preferred currency
            const mpesaPayment = await paymentHandler.mpesa(customer.phone, tripAmount, 'CDF');
            if(mpesaPayment.status != true) return responseMessages.badRequest('Could not make payment please try again later or collect cash.', res);

            rideRequest.final_amount = tripAmount;
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
        rideRequest.tripEndedBy = req.user._id;
        rideRequest.save();

        const driver = await Driver.findById(rideRequest.driverId);
        driver.isOnATrip = false;
        await driver.save();

        // notify customer and driver
        const message = {}, data = {};
        data.rideRequestId = req.params.tripId;

        message.title = "Your trip has ended.";
        message.body = "Kindly click this notification to view details.";
        //send push notification
        pushNotification.sendNotification(customer.deviceId, message, data);      // notify customer        
        pushNotification.sendNotification(driver.deviceId, message, data);       // notify driver

        return responseMessage.success('Trip ended successfully. Have a nice day.', rideRequest, res);
    },

    // Currency services    
    createCurrency: async(req, res) => {
        const { error } = validate.createCurrency(req.body);
        if(error) return responseMessage.badRequest(error.details[0].message, res);

        const currencyExists = await CurrencyExchangeRate.findOne({currency: req.body.currency});
        if(currencyExists) return responseMessage.badRequest('Currency already exists', res);

        const currency = new CurrencyExchangeRate(_.pick(req.body, variables.currencyDetails));
        currency.createdBy = req.user._id;
        currency.approvedRate = req.body.newRate;  // using this because, currency is only created by a superAdmin
        await currency.save();

        const data = _.pick(currency, variables.currencyShortDetails);
        return responseMessage.created('currency created successfully!', data, res);
    },

    getCurrencies: async(req, res) => {
        const currencies = await CurrencyExchangeRate.find().select(variables.currencyDetails);
        if(currencies.length == 0) return responseMessage.notFound('No currencies found', res);

        return responseMessage.success('Listing all currencies.', currencies, res);
    },

    getSingleCurrency: async(req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.currencyId)) return responseMessage.notFound('Invalid currency.', res);
        const currency = await CurrencyExchangeRate.findById(req.params.currencyId).populate('createdBy', ['firstName', 'lastName']);
        if(!currency) return responseMessage.notFound('Invalid currency.', res);

        const currencyActivities = await CurrencyActivity.find({currencyId: currency._id}).populate('userId', ['firstName', 'lastName']);
        const data = {};
        data.currency = currency;
        data.currencyActivities = currencyActivities;

        return responseMessage.success('Showing the details of the selected currency.', data, res);
    },

    updateCurrency: async(req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.currencyId)) return responseMessage.notFound('Invalid currency.', res);
        const { error } = validate.updateCurrency(req.body);
        if(error) return responseMessage.badRequest(error.details[0].message, res);

        const currency = await CurrencyExchangeRate.findById(req.params.currencyId).select(variables.currencyDetails);        
        if(!currency) return responseMessage.badRequest('Invalid currency', res);
        
        if(currency.newRate === req.body.newRate) return responseMessage.badRequest('New currency rate is the same with the current currency rate', res);
        currency.newRate = req.body.newRate;
        currency.isNewRateUpdated = true;
        currency.lastUpdatedBy = req.user._id;
        await currency.save();

        //log this activity
        await currencyActivityLogger(req.params.currencyId, req.user._id, 'Created rate was updated', null );
        return responseMessage.success('currency rate updated successfully!', currency, res);

    },

    fetchCurrenciesForApproval: async(req, res) => {
        const currencies = await CurrencyExchangeRate.find({ isNewRateUpdated: true }).select(variables.currencyDetails);
        if(currencies.length == 0) return responseMessage.notFound('No currency is awaiting approval', res);

        return responseMessage.success('Listing all currencies awaiting approval', currencies, res);
    },

    approveOrDisapproveCurrency: async(req, res) => {
        const {error} = validate.currencyApproval(req.body);
        if(error) return responseMessage.badRequest(error.details[0].message, res);

        const currency = await CurrencyExchangeRate.findById(req.params.currencyId);
        if(!currency) return responseMessage.badRequest('Invalid currency', res);
        if(currency.lastUpdatedBy == req.user._id) return responseMessage.forbidden('You can not update and approve a currency rate.', res);

        if(req.body.status  === 'Approved') currency.approvedRate = currency.newRate;
        currency.isNewRateUpdated = false;
        await currency.save();

        // log this activity.
        currencyActivityLogger(currency._id, req.user._id, `Currency rate was ${req.body.status}.`, req.body.comment);

        const data = _.pick(currency, variables.currencyShortDetails);
        return responseMessage.success(`Currency ${req.body.status} successfully!.`, data, res);        
    },
    
    seedCurrency: async (req, res) => {
        const fs = require('fs');

        const currencies = new Promise((resolve, reject) => {
            fs.readFile('./currencies.json', 'utf8' , (err, data) => {
                if (err) {
                    console.log(err);
                    reject(new Error(err));
                }else{
                    resolve(JSON.parse(data));
                }    
            });
        });

        currencies.then(currencies => {
            currencies.forEach(currency => {
                const data = new CurrencyExchangeRate(currency);
                data.createdBy = req.user._id;
                if(data.currency === 'CDF') {
                    data.approvedRate = 2000;
                }else{
                    data.approvedRate = 1;
                }
                data.save();
            });
        }).catch(err => console.log(err.message));

        return responseMessage.created('Currency has been seeded to DB', currencies, res);
    },

    // pilot reports
    getPilotUsageReports: async(req, res) => {
        const nigeria = /234/,
            congo = /243/,
            nigerianDrivers = await Driver.find({phone: {$regex: nigeria}}).countDocuments(),
            congoDrivers = await Driver.find({phone: {$regex: congo}}).countDocuments(),

            nigerianCustomers = await Customer.find({phone: {$regex: nigeria}}).countDocuments(),
            congoCustomers = await Customer.find({phone: {$regex: congo}}).countDocuments(),

            nigerianDriversWithVehicleAssigned = await Driver.find({phone: {$regex: nigeria}, hasVehicleAssigned: true}).countDocuments(),
            congoDriversWithVehicleAssigned = await Driver.find({phone: {$regex: congo}, hasVehicleAssigned: true}).countDocuments(),
        data = {};

        data.totalRegDriversInCongo = congoDrivers;
        data.totalRegDriversInNigeria = nigerianDrivers;
        data.totalRegDriversInOtherCountries = (await Driver.find().countDocuments()) - (congoDrivers + nigerianDrivers);
        data.totalRegDrivers = await Driver.find().countDocuments();
        data.nigerianDriversWithVehicleAssigned = nigerianDriversWithVehicleAssigned;
        data.congoDriversWithVehicleAssigned = congoDriversWithVehicleAssigned;
        data.totalRegCustomersInCongo = congoCustomers;
        data.totalRegCustomersInNigeria = nigerianCustomers;
        data.totalRegCustomersInOtherCountries = (await Customer.find().countDocuments()) - (nigerianCustomers + congoCustomers);
        data.totalRegCustomers = await Customer.find().countDocuments();
        data.totalRegisteredUsers = data.totalRegDrivers + data.totalRegCustomers;

        return responseMessage.success('Hi Chief! here is the report you requested', data, res);
    },

    getCongoDrivers: async(req, res) => {
        const query = /234/,
            congoDrivers = await Driver.find({phone: {$not: query}}).select('phone');
            // fs.writeFileSync('congo drivers.json', JSON.stringify(congoDrivers));  
            // const data = congoDrivers.count();      

        return responseMessage.success('Hi Chief! here is the report you requested', congoDrivers, res);
    },

    getCongoCustomers: async(req, res) => {
        const query = /234/,
            congoCustomers = await Customer.find({phone: {$not: query}}).select('phone');
            // fs.writeFileSync('congo customers.json', JSON.stringify(congoCustomers));  
            // const data = congoCustomers.count(); 

        return responseMessage.success('Hi Chief! here is the report you requested', congoCustomers, res);
    },


// Admin Dashboard

getVehiclePendingApprovalCount : async(req, res) => {
    const pendingVehicles = await Vehicle.find({ isDeleted: false, isApproved: false, approvedOrDisapprovedBy: null });

    return responseMessage.success("Count of Pending Vehicles Approval",pendingVehicles.length,res);

},
getDriversPendingApprovalCount : async(req, res) => {
    const pendingDrivers = await Driver.find({ isApproved: false, approvedOrDisapprovedBy: null });

    return responseMessage.success("Count of Pending Drivers Approval",pendingDrivers.length,res);

},
getApprovedVehiclesCount : async(req, res) => {
    const approvedVehicles = await Vehicle.find({ isDeleted: false, isApproved: true });

    return responseMessage.success("Count of Approved Vehicles",approvedVehicles.length,res);

},
getApprovedDriversCount : async(req, res) => {
    const approvedDrivers = await Driver.find({ isApproved: true });

    return responseMessage.success("Count of Approved Drivers",approvedDrivers.length,res);
},
getAllCustomersCount: async (req, res) => {
    const customers = await Customer.find({password: {$ne: null}}).sort({createdAt: -1})
    
    

    return responseMessage.success('Count of All Customers.', customers.length, res);
},

getAllUsersCount: async (req, res) => {
    const customers = await Customer.find({password: {$ne: null}}).sort({createdAt: -1});
    const carOwners = await CarOwner.find({password: {$ne: null}});
    const drivers =  await Driver.find({ isDeleted: false, isApproved: true });

    const cnt = customers.length + carOwners.length + drivers.length;
    return responseMessage.success('Count of All Users.', cnt, res);
},
getAdminFullDashboard : async(req, res) => {
    const pendingVehicles = await Vehicle.find({ isDeleted: false, isApproved: false, approvedOrDisapprovedBy: null });
    const pendingDrivers = await Driver.find({isApproved: false, approvedOrDisapprovedBy: null });
    const approvedVehicles = await Vehicle.find({ isDeleted: false, isApproved: true });
    const approvedDrivers = await Driver.find({ isApproved: true });

    const customers = await Customer.find({password: {$ne: null}}).sort({createdAt: -1});
    const carOwners = await CarOwner.find({password: {$ne: null}});
    const drivers =  await Driver.find({ isDeleted: false, isApproved: true });


    var response = {
     "pendingVehicles": pendingVehicles.length,
     "pendingDrivers" : pendingDrivers.length,
     "approvedVehicles":  approvedVehicles.length,
     "approvedDrivers" : approvedDrivers.length,
     "customers": customers.length,
     "users" : customers.length + carOwners.length + drivers.length,
     "carOwners": carOwners.length

    };

    return responseMessage.success("Dashboard Counts", response,res);


}

};

async function currencyActivityLogger(currencyId, userId, activity, message){
    const currencyActivity = new CurrencyActivity();
    currencyActivity.currencyId = currencyId;
    currencyActivity.userId = userId;
    currencyActivity.currencyActivity = activity;
    currencyActivity.message = message;
    await currencyActivity.save();
}