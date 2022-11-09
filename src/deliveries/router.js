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

router.put( '/drivers/endTrip/:deliveryRequestId', [ auth, accessControl.isDriver ], deliveryRequestService.endDelivery );


router.put('/proceed/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.continueDeliveryRequest);

router.put( '/complete/:deliveryOrderId',[ auth, accessControl.isCustomer ], deliveryRequestService.completeDeliveryRequest );


// get a driver's trip history
router.get( '/drivers/trips/history', [ auth, accessControl.isDriver ], deliveryRequestService.fetchDriverDeliveryHistory );


//fetch all ride requests made by a customer
router.get( '/customers', [ auth, accessControl.isCustomer ], deliveryRequestService.fetchUserDeliveryRequests );


// fetch single delivery request details
router.get( '/:deliveryRequestId', [ auth ], deliveryRequestService.fetchSingleDeliveryRequestDetails );




module.exports = router;