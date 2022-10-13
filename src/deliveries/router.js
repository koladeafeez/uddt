const express = require('express'),
    router = express.Router(),
    deliveryRequestService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');



/* *******************************   CUSTOMER ROUTES   ******************************* */
// request ride
router.post( '/',[ auth, accessControl.isCustomer ], deliveryRequestService.initiateDelivery );


// accept Delivery request
router.put( '/drivers/accept/:deliveryRequestId', [ auth, accessControl.isDriver ], deliveryRequestService.acceptDeliveryRequest );

// Start Delivery
router.put( '/drivers/startTrip/:deliveryRequestId', [ auth, accessControl.isDriver ], deliveryRequestService.startDelivery );


router.put('/proceed/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.continueDeliveryRequest);

router.put( '/complete/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.completeDeliveryRequest );

// fetch single delivery request details
router.get( '/:deliveryRequestId', [ auth ], deliveryRequestService.fetchSingleDeliveryRequestDetails );


module.exports = router;