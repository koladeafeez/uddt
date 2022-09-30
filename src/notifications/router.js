const express = require('express'),
    router = express.Router(),
    notifyService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');

// create
router.post( '/createByAdmin',[ auth, accessControl.isAdmin], notifyService.createByAdmin );

router.post( '/createBySuperAdmin',[ auth, accessControl.isSuperAdmin], notifyService.createBySuperAdmin );


//Fetch All recent Notificatons for carOwner
router.get('/fetchAllForCarOwner',[auth,accessControl.isCarOwner],notifyService.fetchForCarOwner)

//Fetch All recent notifications for Customer
router.get('/fetchAllForCustomer',[auth,accessControl.isCustomer],notifyService.fetchForCustomer)

//Fetch All recent notifications for Drivers
router.get('/fetchAllForDriver',[auth,accessControl.isDriver],notifyService.fetchForDrivers)

//Fetch All recent notifications for Admins
router.get('/fetchAllForAdmin',[auth,accessControl.isAdmin],notifyService.fetchForAdmins)

//get single

router.get('/single/:id',notifyService.get);


router.post('/readNotifications',notifyService.readNotifications);




module.exports = router;