const responseMessage = require('../helpers/responseMessages'),
    _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    variables = require('../helpers/parameters'),
    mailService = require('../helpers/mailServices'),
    smsService = require('../helpers/smsService'),
    helpers = require('../helpers/subroutines'),
    mongoose = require('mongoose'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    { RideRequest } = require('../rideRequests/model'),
    { Driver } = require('../drivers/model'),
    { Vehicle } = require('../vehicles/model'),
{ CarOwner } = require('./model');

module.exports = {
    registration: async (req, res) => {
        const { error } = validate.registration(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const email = await CarOwner.findOne({email:req.body.email.toLowerCase()});
        if(email) return responseMessage.badRequest('Email already exists.', res);

        const phone = await CarOwner.findOne({phone:req.body.phone});
        if(phone) return responseMessage.badRequest('Phone number already exists.', res);

        let carOwner = new CarOwner(_.pick(req.body, variables.carOwnerDetails));  
        carOwner.country = req.body.country.toLowerCase();
        carOwner.email = req.body.email.toLowerCase();
        const salt = await bcrypt.genSalt(10);        
        carOwner.password = await bcrypt.hash(req.body.password, salt);
        carOwner.email_verification_token = helpers.generateEmailVerificationToken(req.body.email);
        carOwner.email_verification_token_expires_on = helpers.getCurrentDate.addDays(1);  //expires in 1 day
        carOwner = await carOwner.save(); 

        mailService.sendVerificationEmail(carOwner);
        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessage.created('You have been registered!', carOwner, res);
    },

    login: async (req, res) =>{
        const { error } = validate.login(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let carOwner = await CarOwner.findOne({email: req.body.email.toLowerCase()});
        if (!carOwner) return responseMessage.badRequest( 'Invalid email or password. You can use the forgot password feature to reset your password.', res );
        if (carOwner.accountStatus == 'Suspended') return responseMessage.unauthorized( 'Your account has been suspended please contact admin', res );

        const validPassword = await bcrypt.compare(req.body.password, carOwner.password);
        if (!validPassword) return responseMessage.badRequest( 'Invalid email or password. You can use the forgot password feature to reset your password.', res );

        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        const token = helpers.generateAuthToken(carOwner);

        if (carOwner.isEmailVerified == true) return responseMessage.successfulLogin( token, 'You have logged in successfully!', carOwner, res );  
        return responseMessage.partialContent( 'Please verify your email address', carOwner, res );
    },

    verifyEmail: async (req, res) => {
        let carOwner = await CarOwner.findOne({
            email_verification_token: req.params.token, 
            email_verification_token_expires_on:  {$gte: Date.now()}
        });
        if(!carOwner) return responseMessage.badRequest('Invalid or expired token.', res);

        carOwner.isEmailVerified = true;
        carOwner.email_verification_token = null;
        carOwner.email_verification_token_expires_on = null;
        await carOwner.save();

        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        const token = helpers.generateAuthToken(carOwner);
        return responseMessage.successfulLogin( token, 'Your email has been verified successfully!.', carOwner, res );
    },    

    regenerateEmailVerificationMail: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );

        const carOwner = await CarOwner.findOne({email: req.body.email.toLowerCase()});      
        if(!carOwner) return responseMessage.badRequest( 'Sorry, this email does not exist in our records', res );
        if(carOwner.isEmailVerified == true) return responseMessage.badRequest( 'You have already verified your email address. Kindly proceed to login.', res );
        
        carOwner.email_verification_token = helpers.generateEmailVerificationToken(carOwner.email);
        carOwner.email_verification_token_expires_on = helpers.getCurrentDate.addDays(1);  //expires in 1 day
        await carOwner.save();

        mailService.sendVerificationEmail(carOwner);
        return responseMessage.success('A new verification email has been sent to your email inbox. Please check your mail and follow the instructions therein to confirm your account', null, res);
    },

    forgotPassword: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );
        const carOwner = await CarOwner.findOne({email: req.body.email.toLowerCase()});
        if(!carOwner) return responseMessage.badRequest( 'Sorry, this email does not exist in our records', res );

        carOwner.passwordResetToken = helpers.generateAuthToken(carOwner);
        carOwner.passwordResetToken_expires_on = Date.now() + (10 * 60 * 1000);   // expires in 10 minutes time
        await carOwner.save();
        
        mailService.sendPasswordResetEmail(carOwner);
        return responseMessage.success( 'An email was sent to the email address provided. Kindly check your email and follow the instructions therein.', null, res );
    },



    resetPassword: async (req, res) => {
        const { error } = validate.password(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let carOwner = await CarOwner.findOne({ passwordResetToken: req.params.token, passwordResetToken_expires_on: {$gte: Date.now()} });
        if(!carOwner) return responseMessage.badRequest('Invalid or expired token', res);

        const salt = await bcrypt.genSalt(10);        
        carOwner.password = await bcrypt.hash(req.body.password, salt);
        carOwner.passwordResetToken = null;
        carOwner.passwordResetToken_expires_on = null;
        await carOwner.save();

        const token = helpers.generateAuthToken(carOwner);
        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessage.successfulLogin( token, 'Your password has been updated successfully!.', carOwner, res );
    },

    profile: async (req, res) => {
        let carOwner = await CarOwner.findById(req.user._id);
        if(!carOwner) return responseMessage.badRequest('Invalid user.', res);

        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessage.success('carOwner retrieved sucessfully!', carOwner, res);
    },

    update: async (req, res) => {
        const { error } = validate.profileUpdate(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        if (!mongoose.Types.ObjectId.isValid(req.params.carOwnerId)) return responseMessage.notFound('User does not exist.', res);
        let carOwner = await CarOwner.findById(req.params.carOwnerId);
        if(!carOwner) return responseMessage.notFound('User does not exist.', res);
        if(req.user._id != req.params.carOwnerId) return responseMessage.forbidden('Please consult the account owner.', res);

        carOwner.firstName = req.body.firstName;
        carOwner.lastName = req.body.lastName;
        if(req.files && req.files.profile_picture) carOwner.profile_picture = req.files.profile_picture[0].path;
        carOwner.phone = req.body.phone;        
        carOwner = await carOwner.save();

        carOwner = _.pick(carOwner, variables.carOwnerDetails);
        return responseMessage.success('Profile updated successfully!', carOwner, res);
    },

    trips: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.user._id}).select('plate_number');
        if(vehicles.length == 0) return responseMessage.notFound("You have not registered any vehicles yet", res);
        
        // extract plate numbers from vehicles
        const plateNumbers = [];
        vehicles.forEach( vehicle => { plateNumbers.push(vehicle.plate_number); });

        // get trips involved
        const trips = await RideRequest.find({vehicle_plate_number: {$in: plateNumbers}}).select(variables.rideRequestDetails);
        if(trips.length == 0) return responseMessage.notFound("No trips found.", res);

        return responseMessage.success('Displaying all trips made with your vehicles', trips, res);
    },
//{vehicleId:ObjectId('60da5c84f741f51165d381ae')}
// {ownerId: ObjectId('62f5030651d68bb43a6134ef')}
//60e70449d7a8f84bf5c067c7

//60dee75df741f51165d381d9
    myDrivers: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.user._id, isDeleted : false});
        if(vehicles.length == 0) return responseMessage.notFound("You have not registered any vehicles yet", res);
        
        const vehicleIds = [];
        vehicles.forEach( vehicle => { vehicleIds.push(vehicle.id); });

        // get drivers
        const drivers = await Driver.find({vehicleId: {$in: vehicleIds}, hasVehicleAssigned : true}).select(variables.driverDetails);
        if(drivers.length == 0) return responseMessage.notFound("No drivers found.", res);

        return responseMessage.success('Displaying all your drivers.', drivers, res);
    },
// vehucle 6130dbba2fea4def447b5009 //owner 62f5030651d68bb43a6134ef
    assignedVehicles: async (req, res) => {
        const vehicles = await Vehicle.find({ driverId: { $ne: null }, ownerId: req.user._id }).select(variables.vehicleDetails);
        if(vehicles.length == 0) return responseMessage.notFound("You have not assigned any vehicles to a driver yet", res);

        return responseMessage.success('Displaying all your vehicles with drivers assigned.', vehicles, res);
    },

    todaysIncome: async (req, res) => {
        const vehicles = await Vehicle.find({ownerId: req.user._id}).select('plate_number');
        if(vehicles.length == 0) return responseMessage.success('Total amount made today is', 0, res);
        
        // extract plate numbers from vehicles
        const plateNumbers = [];
        vehicles.forEach( vehicle => { plateNumbers.push(vehicle.plate_number); });

        // get trips made with the vehicles that ended today
        let startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
        const trips = await RideRequest.find({vehicle_plate_number: {$in: plateNumbers}, trip_ended_at: {$gte: startOfToday} });
        if(trips.length == 0) return responseMessage.success('Total amount made today is', 0, res);

        let todaysIncome = 0;
        trips.forEach( trip => { 
            todaysIncome += trip.final_amount;
        });

        return responseMessage.success('Total amount made today is', todaysIncome, res);
    },

};