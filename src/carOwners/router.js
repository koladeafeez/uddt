const express = require('express'),
    router = express.Router(),
    carOwnerService = require('./service'),
    { upload } = require('../helpers/multer'),
    auth = require('../middlewares/auth'),
    accessControl = require('../middlewares/accessControl'),
mediaUpload = upload.fields([ { name: 'profile_picture', maxCount: 1 } ]);

// registration
router.post( '/register', carOwnerService.registration );

// get profile of the current logged in car owner
router.get( '/profile', auth, carOwnerService.profile );



// update carOwner profile
router.put( '/profile/:carOwnerId', auth, mediaUpload, carOwnerService.update );

//car owner login
router.post( '/login', carOwnerService.login );

//email verification
router.put( '/verifyEmail/:token', carOwnerService.verifyEmail );

//regenerate email verification token
router.post( '/regenerateEmailVerificationToken', carOwnerService.regenerateEmailVerificationMail );

//forgot password
router.post( '/forgotPassword', carOwnerService.forgotPassword );

//reset password
router.put( '/resetPassword/:token', carOwnerService.resetPassword );


/*************************************************************************
                            Dashboard reports
**************************************************************************/

//Get all trips made with carOwner's vehicles
router.get( '/trips', [auth, accessControl.isCarOwner], carOwnerService.trips );

//Get all carOwner's drivers
router.get( '/myDrivers', [auth, accessControl.isCarOwner], carOwnerService.myDrivers );

//Get all carOwner's drivers
router.get( '/assignedVehicles', [auth, accessControl.isCarOwner], carOwnerService.assignedVehicles );

//Get all carOwner's income for the day
router.get( '/todaysIncome', [auth, accessControl.isCarOwner], carOwnerService.todaysIncome );

module.exports = router;