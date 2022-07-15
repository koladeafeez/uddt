const express = require('express'),
    router = express.Router(),
    driverService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');

// registration
router.post( '/register', driverService.registration );

// driver profile
router.get( '/profile', [ auth, accessControl.isDriver ], driverService.profile );

// set driver status (online or offline)
router.put( '/setStatus', [ auth, accessControl.isDriver ], driverService.setStatus );

//generate OTP
router.post( '/getOtp', driverService.generateOTP );

//user login
router.post( '/login', driverService.login );

//forgot password
router.post( '/forgotPassword', driverService.forgotPassword );

//reset password
router.put( '/resetPassword/:resetPasswordOtp', driverService.resetPassword );

//verify OTP
router.post( '/:otp', driverService.verifyOTP );

// get current driver's profile
router.put( '/profile/:id', [ auth, accessControl.isDriver ], driverService.update );

// update profile picture
router.put( '/profilePicture', [ auth, accessControl.isDriver ], driverService.updateProfilePicture );

// update device Id
router.put( '/updateDeviceId', [ auth, accessControl.isDriver ], driverService.updateDeviceId );

module.exports = router;