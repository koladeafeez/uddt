const _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    smsService = require('../helpers/smsService'),
    helpers = require('../helpers/subroutines'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    mongoose = require('mongoose'),
{ Driver } = require('./model');

module.exports = {
    generateOTP: async (req, res) => {
        const { error } = validate.phoneNumber(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        // req.body.phone = req.body.phone.replace(/\D/g,""); // remove non-numbers from the phone number
        let driver = await Driver.findOne({phone: req.body.phone});
        if(driver && driver.isPhoneVerified == true) return responseMessage.badRequest('An account already exists with this phone number.', res);

        if(!driver) driver = new Driver(_.pick(req.body, variables.driverDetails));   
        const otp = helpers.generateOTP();
        driver.otp = otp;
        driver.country = req.body.country.toLowerCase();
        driver.otp_expires_on = Date.now() + ( 2 * 60 * 1000);   // expires in 2 minutes time
        await driver.save();
        
        //sms the otp to user
        const message = `Your 4-digit OTP is ${otp}.`;
        smsService.sendSMS(req.body.phone, message);

        return responseMessage.success('A 4-digit OTP has been sent to the provided number. Kindly use it to proceed to the next step.', null, res);
    },

    verifyOTP: async (req, res) => {
        let driver = await Driver.findOne({ otp: req.params.otp, otp_expires_on: {$gte: Date.now()} });
        if(!driver) return responseMessage.badRequest('Invalid or expired OTP.', res);

        driver.otp = null;
        driver.otp_expires_on = null;
        driver.isPhoneVerified = 1;
        await driver.save();

        driver = _.pick(driver, variables.driverDetails);
        return responseMessage.success('Phone verification successful!', driver, res);
    },

    registration: async (req, res) => {
        const { error } = validate.registration(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const email = await Driver.findOne({email:req.body.email.toLowerCase()});
        if(email) return responseMessage.badRequest('Email already exists.', res);

        if (!mongoose.Types.ObjectId.isValid(req.body.id)) return responseMessage.notFound('Invalid driver.', res);
        let driver = await Driver.findOne({_id: req.body.id});
        if(!driver) return responseMessage.badRequest('The user with the given Id was not found', res);
        if(driver && driver.password != null) return responseMessage.badRequest('Please verify your phone number before proceeding.', res);

        driver.email = req.body.email.toLowerCase();  
        driver.firstName = req.body.firstName;
        driver.lastName = req.body.lastName;
        const salt = await bcrypt.genSalt(10);        
        driver.password = await bcrypt.hash(req.body.password, salt);
        driver.profile_picture = req.body.profile_picture;
        driver.drivers_license_front = req.body.drivers_license_front;
        driver.drivers_license_back = req.body.drivers_license_back;
        await driver.save();

        driver = _.pick(driver, variables.driverDetails);
        const token = helpers.generateAuthToken(driver);
        return responseMessage.successfulLogin( token, 'You have been registered!', driver, res );
    },

    login: async (req, res) =>{
        const { error } = validate.login(req.body);

        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let driver = await Driver.findOne({phone: req.body.phone});
        if (!driver) return responseMessage.badRequest( 'Invalid phone number or password. You can use the forgot password feature to reset your password.', res );
        if (driver.accountStatus == 'Suspended') return responseMessage.unauthorized( 'Your account has been suspended please contact admin', res );

        const validPassword = await bcrypt.compare(req.body.password, driver.password);
        if (!validPassword) return responseMessage.badRequest( 'Invalid phone number or password. You can use the forgot password feature to reset your password.', res );

        driver.deviceId = req.body.deviceId;
        await driver.save();

        driver = _.pick(driver, variables.driverDetails);
        const token = helpers.generateAuthToken(driver);
        if(driver.isPhoneVerified == true) return responseMessage.successfulLogin( token, 'You have logged in successfully!', driver, res );
        return responseMessage.partialContent('You have logged in successfully, please verify your phone number', driver, res);
    },

    forgotPassword: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );
        let driver = await Driver.findOne({email: req.body.email.toLowerCase()});
        if(!driver) return responseMessage.badRequest( 'Sorry, this email does not exist in our records', res );
        const otp = helpers.generateOTP();

        driver.passwordResetOtp = otp;
        driver.passwordResetOtp_expires_on = Date.now() + (10 * 60 * 1000);   // expires in 10 minutes time
        await driver.save();
        
        const message = `Hello ${driver.firstName}, here is your 4-digit password reset OTP. ${otp}`;
        smsService.sendSMS(driver.phone, message);
        return responseMessage.success('A 4-digit OTP has been sent to your phone number. Kindly enter it on the next screen to reset your password.', null, res);
    },

    resetPassword: async (req, res) => {
        const { error } = validate.password(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let driver = await Driver.findOne({passwordResetOtp: req.params.resetPasswordOtp, passwordResetOtp_expires_on: {$gte: Date.now()} });
        if(!driver) return responseMessage.badRequest('Invalid or expired OTP', res);

        const salt = await bcrypt.genSalt(10);        
        driver.password = await bcrypt.hash(req.body.password, salt);
        driver.passwordResetOtp = null;
        driver.passwordResetOtp_expires_on = null;
        driver.isPhoneVerified = true;
        await driver.save();

        const token = helpers.generateAuthToken(driver);
        driver = _.pick(driver, variables.driverDetails);
        return responseMessage.successfulLogin( token, 'Your password has been updated successfully!.', driver, res );
    },

    profile: async (req, res) => {
        let driver = await Driver.findById(req.user._id);
        if(!driver) return responseMessage.notFound('Invalid or expired token', res);

        driver = _.pick(driver, variables.driverDetails);
        return responseMessage.success('Driver retrieved sucessfully!', driver, res);
    },

    update: async (req, res) => {
        const { error } = validate.profileUpdate(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return responseMessage.notFound('Driver does not exist.', res);
        let driver = await Driver.findById(req.params.id);
        if(!driver) return responseMessage.notFound('Driver does not exist.', res);
        if(req.user._id != req.params.id) return responseMessage.forbidden('Please consult the account owner.', res);

        driver.firstName = req.body.firstName;
        driver.lastName = req.body.lastName;
        driver.profile_picture = req.body.profile_picture;
        driver.drivers_license_back = req.body.drivers_license_back;
        driver.drivers_license_front = req.body.drivers_license_front;

        if(req.body.phone && req.body.phone != driver.phone) {
            const phone = await Driver.findOne({phone: req.body.phone});
            if(phone) return responseMessage.badRequest('New phone number already exists.', res);

            driver.phone = req.body.phone;
            driver.isPhoneVerified = false;
            driver.otp = helpers.generateOTP();
            driver.otp_expires_on = Date.now() + (10 * 60 * 1000);   // expires in 10 minutes time
            //sms the otp to user
            const message = `Hi ${driver.firstName}, your 4-digit OTP is ${driver.otp}`;
            smsService.sendSMS(req.body.phone, message);
        }
        
        await driver.save();
        driver = _.pick(driver, variables.driverDetails);
        if(req.body.phone && req.body.phone != driver.phone) return responseMessage.success('A 4-digit OTP has been sent to the updated phone number. Kindly use it to verify your phone number', driver, res);
        return responseMessage.success('Profile updated successfully!', driver, res);
    },

    setStatus: async (req, res) => {
        const { error } = validate.status(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let driver = await Driver.findById(req.user._id);
        if(!driver) return responseMessage.badRequest('Invalid user.', res);

        if(req.body.status == 0){
            driver.isOnline = false;
            driver.driver_coordinates = null;
        }else{
            driver.isOnline = true;
            driver.driver_coordinates = req.body.driver_coordinates;
        }

        driver = await driver.save();
        driver = _.pick(driver, variables.driverDetails);
        return responseMessage.success('Status updated successfully!', driver, res);
    },

    updateDeviceId: async (req, res) => {
        if(!req.body.deviceId) return responseMessage.badRequest('deviceId is required.', res);
        let driver = await Driver.findById(req.user._id);
        if(!driver) return responseMessage.badRequest('Invalid user.', res);

        driver.deviceId = String(req.body.deviceId);
        driver = await driver.save();

        return responseMessage.success('Status updated successfully!', null, res);
    },

    updateProfilePicture: async (req, res) => {
        const driver = await Driver.findById(req.user._id);
        if(!driver) return responseMessage.notFound('driver does not exist.', res);
        if(!req.body.profile_picture) return responseMessage.badRequest('Please upload a valid profile picture', res);

        driver.profile_picture = req.body.profile_picture;        
        await driver.save();

        data = _.pick(driver, variables.driverDetails);
        return responseMessage.success('Profile picture updated successfully!', data, res);
    },
};