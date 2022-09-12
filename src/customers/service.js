const _ = require('lodash'),
    bcrypt = require('bcrypt'),
    validate = require('./validation'),
    responseMessage = require('../helpers/responseMessages'),
    variables = require('../helpers/parameters'),
    smsService = require('../helpers/smsService'),
    mailService = require('../helpers/mailServices'),
    helpers = require('../helpers/subroutines'),
    mongoose = require('mongoose'),
    validEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
{ Customer } = require('./model');

module.exports  = {
    generateOTP: async (req, res) => {
        const { error } = validate.phoneNumber(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        // req.body.phone = req.body.phone.replace(/\D/g,""); // remove non-numbers from the phone number
        let customer = await Customer.findOne({phone: req.body.phone});
        if(customer &&  customer.password != null) return responseMessage.badRequest('An account already exists with this phone number.', res);
        
        if(!customer) customer = new Customer(_.pick(req.body, variables.customerDetails));  
        const otp = helpers.generateOTP();
        customer.otp = otp;
        customer.country = req.body.country.toLowerCase();
        customer.otp_expires_on = Date.now() + (2 * 60 * 1000);   // expires in 2 minutes time
        await customer.save();
        
        //sms the otp to user
        const message = `Your 4-digit OTP is  ${otp}.`;
        smsService.sendSMS(req.body.phone, message);

        return responseMessage.success('A 4-digit OTP has been sent to the provided number. Kindly use it to proceed to the next step.', null, res);
    },

    verifyOTP: async (req, res) => {
        let customer = await Customer.findOne({ otp: req.params.otp, otp_expires_on: {$gte: Date.now()} });
        if(!customer) return responseMessage.badRequest('Invalid or expired OTP.', res);

        customer.otp = null;
        customer.otp_expires_on = null;
        customer.isPhoneVerified = 1;
        await customer.save();

        customer = _.pick(customer, variables.customerDetails);
        return responseMessage.success('Phone verification successful!', customer, res);
    },

    registration: async (req, res) => {
        const { error } = validate.registration(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        const email = await Customer.findOne({email:req.body.email.toLowerCase()});
        if(email) return responseMessage.badRequest('Email already exists.', res);

        if (!mongoose.Types.ObjectId.isValid(req.body.id)) return responseMessage.notFound('Invalid user.', res);
        let customer = await Customer.findOne({_id: req.body.id});
        if(!customer) return responseMessage.badRequest('User not found', res);
        if(customer.isPhoneVerified == false) return responseMessage.badRequest('Please verify your phone number before proceeding.', res);

        customer.email = req.body.email.toLowerCase();  
        customer.firstName = req.body.firstName;
        customer.lastName = req.body.lastName;
        customer.payment_mode = req.body.payment_mode;
        customer.currency = req.body.currency;
        customer.profile_picture = "";
        const salt = await bcrypt.genSalt(10);

        customer.password = await bcrypt.hash(req.body.password, salt);
        await customer.save();

        customer = _.pick(customer, variables.customerDetails);
        const token = helpers.generateAuthToken(customer);
        return responseMessage.successfulLogin( token, 'You have been registered!', customer, res );
    },

    login: async (req, res) =>{
        const { error } = validate.login(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let customer = await Customer.findOne({phone: req.body.phone});
        if (!customer) return responseMessage.badRequest( 'Invalid phone number or password. You can use the forgot password feature to reset your password.', res );
        if (customer.accountStatus == 'Suspended') return responseMessage.unauthorized( 'Your account has been suspended please contact admin', res );

        const validPassword = await bcrypt.compare(req.body.password, customer.password);
        if (!validPassword) return responseMessage.badRequest( 'Invalid phone number or password. You can use the forgot password feature to reset your password.', res );

        customer.deviceId = req.body.deviceId;
        await customer.save();

        customer = _.pick(customer, variables.customerDetails);
        const token = helpers.generateAuthToken(customer);
        if(customer.isPhoneVerified == true) return responseMessage.successfulLogin( token, 'You have logged in successfully!', customer, res );
        return responseMessage.partialContent('You have logged in successfully, please verify your phone number', customer, res);
    },

    forgotPassword: async (req, res) => {
        if(!req.body.email || !req.body.email.match(validEmail)) return responseMessage.badRequest( "Please enter a valid email", res );
        let customer = await Customer.findOne({email: req.body.email.toLowerCase()});
        if(!customer) return responseMessage.badRequest( 'Sorry, this email does not exist in our records', res );
        const otp = helpers.generateOTP();

        customer.passwordResetOtp = otp;
        customer.passwordResetOtp_expires_on = Date.now() + (10 * 60 * 1000);   // expires in 10 minutes time
        await customer.save();
        
        const message = `Hello ${customer.firstName}, here is your 4-digit password reset OTP. ${otp}`;
        smsService.sendSMS(customer.phone, message);
        return responseMessage.success('A 4-digit OTP has been sent to your phone number. Kindly enter it on the next screen to reset your password.', null, res);
    },

    resetPassword: async (req, res) => {
        const { error } = validate.password(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        let customer = await Customer.findOne({passwordResetOtp: req.params.resetPasswordOtp, passwordResetOtp_expires_on: {$gte: Date.now()} });
        if(!customer) return responseMessage.badRequest('Invalid or expired OTP', res);

        const salt = await bcrypt.genSalt(10);        
        customer.password = await bcrypt.hash(req.body.password, salt);
        customer.passwordResetOtp = null;
        customer.passwordResetOtp_expires_on = null;
        customer.isPhoneVerified = true;
        await customer.save();

        const token = helpers.generateAuthToken(customer);
        customer = _.pick(customer, variables.customerDetails);
        return responseMessage.successfulLogin( token, 'Your password has been updated successfully!.', customer, res );
    },

    profile: async (req, res) => {
        let customer = await Customer.findById(req.user._id);
        if(!customer) return responseMessage.notFound('Invalid or expired token', res);

        customer = _.pick(customer, variables.customerDetails);
        return responseMessage.success('Customer retrieved sucessfully!', customer, res);
    },

    update: async (req, res) => {
        const { error } = validate.profileUpdate(req.body);
        if(error) return responseMessage.badRequest( error.details[0].message, res );

        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return responseMessage.notFound('User is invalid.', res);
        let customer = await Customer.findById(req.params.id);
        if(!customer) return responseMessage.notFound('Customer does not exist.', res);
        if(req.user._id != req.params.id) return responseMessage.forbidden('Please consult the account owner.', res);

        customer.firstName = req.body.firstName;
        customer.lastName = req.body.lastName;
        customer.profile_picture = req.body.profile_picture;
        if(req.body.payment_mode != null || req.body.payment_mode != undefined) customer.payment_mode = req.body.payment_mode;

        if(req.body.phone && req.body.phone != customer.phone) {
            const phone = await Customer.findOne({phone: req.body.phone});
            if(phone) return responseMessage.badRequest('New phone number already exists.', res);

            customer.phone = req.body.phone;
            customer.isPhoneVerified = false;
            customer.otp = helpers.generateOTP();
            customer.otp_expires_on = Date.now() + (10 * 60 * 1000);   // expires in 10 minutes time
            //sms the otp to user
            const message = `Hello, here is your 4-digit OTP to verify your phone number on Mopila. ${customer.otp}`;
            smsService.sendSMS(req.body.phone, message);
        }
        
        await customer.save();
        customer = _.pick(customer, variables.customerDetails);
        if(req.body.phone && req.body.phone != customer.phone) return responseMessage.success('A 4-digit OTP has been sent to the updated phone number. Kindly use it to verify your phone number', customer, res);
        return responseMessage.success('Profile updated successfully!', customer, res);
    },

    updateProfilePicture: async (req, res) => {
        const customer = await Customer.findById(req.user._id);
        if(!customer) return responseMessage.notFound('Customer does not exist.', res);
        if(!req.body.profile_picture) return responseMessage.badRequest('Please upload a valid profile picture', res);

        customer.profile_picture = req.body.profile_picture;        
        await customer.save();

        data = _.pick(customer, variables.customerDetails);
        return responseMessage.success('Profile picture updated successfully!', data, res);
    },

    updatePaymentMode: async (req, res) => {
        const customer = await Customer.findById(req.user._id);
        if(!customer) return responseMessage.notFound('Customer does not exist.', res);
        if(!req.body.payment_mode) return responseMessage.badRequest('Payment mode is required.', res);
        if(!req.body.currency) return responseMessage.badRequest('Currency is required.', res);

        customer.payment_mode = req.body.payment_mode;      
        customer.currency = req.body.currency;  
        await customer.save();

        data = _.pick(customer, variables.customerDetails);
        return responseMessage.success('Payment mode updated successfully!', data, res);
    },

    updateDeviceId: async (req, res) => {
        if(!req.body.deviceId) return responseMessage.badRequest('deviceId is required.', res);
        let customer = await Customer.findById(req.user._id);
        if(!customer) return responseMessage.badRequest('Invalid user.', res);

        customer.deviceId = String(req.body.deviceId);
        customer = await customer.save();

        return responseMessage.success('DeviceId updated successfully!', null, res);
    }
};