const express = require('express'),
    router = express.Router(),
    rideRequestService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');


// ********************************   DRIVER ROUTES    ********************************

// accept ride request
router.put( '/drivers/accept/:rideRequestId', [ auth, accessControl.isDriver ], rideRequestService.acceptRideRequest );

// Start trip
router.put( '/drivers/startTrip/:rideRequestId', [ auth, accessControl.isDriver ], rideRequestService.startTrip );

// fetch ongoing trips
router.get( '/drivers/ongoingTrips', [ auth, accessControl.isDriver ], rideRequestService.fetchOngoingTrips );

// Cancel trip
router.put( '/drivers/cancelTrip/:rideRequestId', [ auth, accessControl.isDriver ], rideRequestService.cancelTrip );

// End trip
router.put( '/drivers/endTrip/:rideRequestId', [ auth, accessControl.isDriver ], rideRequestService.endTrip );

// get ride request details
router.get( '/drivers/:rideRequestId', [ auth, accessControl.isDriver ], rideRequestService.fetchRideRequest );

// get a driver's trip history
router.get( '/drivers/trips/history', [ auth, accessControl.isDriver ], rideRequestService.fetchDriverTripHistory );

router.get('/vehicles/trips/:vehicleId',[ auth, accessControl.isCarOwner ], rideRequestService.fetchVehicleTripHistory);

/* *******************************   CUSTOMER ROUTES   ******************************* */
// request ride
router.post( '/',[ auth, accessControl.isCustomer ], rideRequestService.requestRide );

//estimated price
router.post( '/estimatedPrices',[ auth, accessControl.isCustomer ], rideRequestService.getEstimatedTripAmount );


//fetch all ride requests made by a customer
router.get( '/customers', [ auth, accessControl.isCustomer ], rideRequestService.fetchUserRideRequests );

//get single ride request details
router.get('/customers/:rideRequestId', [ auth, accessControl.isCustomer ], rideRequestService.fetchSingleRideRequestDetails);

// Cancel trip if no driver found
router.put( '/customers/cancelTrip/:rideRequestId', [ auth, accessControl.isCustomer ], rideRequestService.cancelTripIfNoDriverFound );

// get driver's profile picture
router.get( '/customers/getDriverPicture/:driverId', [ auth, accessControl.isCustomer ], rideRequestService.getDriverPicture );


/******************************** Test endpoints *****************************************************/
// test notifications
// router.post( '/testNotification', [auth, accessControl.isSuperAdmin], rideRequestService.testNotification );

// test payment
router.post( '/testPayment', rideRequestService.testPayment );

module.exports = router;