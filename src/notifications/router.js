const express = require('express'),
    router = express.Router(),
    notifyService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');

// create
router.post( '/createByAdmin',[ auth, accessControl.isCarOwner], notifyService.createByAdmin );

//Fetch All recent Notificatons for carOwner
router.get('/fetchAllForCarOwner',[auth,accessControl.isCarOwner],notifyService.fetchForCarOwner)

//Fetch All recent notifications for Customer
router.get('/fetchAllForCustomer',[auth,accessControl.isCustomer],notifyService.fetchForCustomer)

//Fetch All recent notifications for Drivers
router.get('/fetchAllForDriver',[auth,accessControl.isDriver],notifyService.fetchForDrivers)

//Fetch All recent notifications for Admins
router.get('/fetchAllForAdmin',[auth,accessControl.isAdmin],notifyService.fetchForAdmins)



// get by id
router.get( '/:notifyId', [ auth, accessControl.isCarOwner ], notifyService.get );

// delete
router.delete( '/:notifyId', [ accessControl.isCarOwner ], notifyService.delete );

// get All
router.get('/',[auth,accessControl.isCarOwner],notifyService.getAll)




module.exports = router;