const express = require('express'),
    router = express.Router(),
    customerService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');

// registration
router.post( '/register', customerService.registration );

// get current customer's profile
router.get( '/profile', [ auth, accessControl.isCustomer ], customerService.profile );

//generate OTP
router.post( '/getOtp', customerService.generateOTP );

//user login
router.post( '/login', customerService.login );

//forgot password
router.post( '/forgotPassword', customerService.forgotPassword );

//reset password
router.put( '/resetPassword/:resetPasswordOtp', customerService.resetPassword );

//verify OTP
router.post( '/:otp', customerService.verifyOTP );

// update profile
router.put( '/profile/:id', [ auth, accessControl.isCustomer ], customerService.update );

// update profile picture
router.put( '/profilePicture', [ auth, accessControl.isCustomer ], customerService.updateProfilePicture );

// update payment mmode
router.put( '/updatePaymentMode', [ auth, accessControl.isCustomer ], customerService.updatePaymentMode );

// update device Id
router.put( '/updateDeviceId', [ auth, accessControl.isCustomer ], customerService.updateDeviceId );

module.exports = router;