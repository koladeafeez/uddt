const express = require('express'),
    router = express.Router(),
    deliveryRequestService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');



/* *******************************   CUSTOMER ROUTES   ******************************* */
// request ride
router.post( '/',[ auth, accessControl.isCustomer ], deliveryRequestService.initiateDelivery );



router.put('/proceed/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.continueDeliveryRequest);

router.put( '/complete/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.completeDeliveryRequest );

module.exports = router;