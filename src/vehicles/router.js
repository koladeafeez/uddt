const express = require('express'),
    router = express.Router(),
    vehicleService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');
    
// get all vehicles registered by a car owner
router.get( '/', [ auth, accessControl.isCarOwner ], vehicleService.getUserVehicles );

// get all approved vehicles for a car owner
router.get( '/approved', [ auth, accessControl.isCarOwner ], vehicleService.approvedVehicles );

// get all disapproved vehicles for a car owner
router.get( '/disapproved', [ auth, accessControl.isCarOwner ], vehicleService.disapprovedVehicles );

// get all vehicles awaiting approval for a car owner
router.get( '/awaitingApproval', [ auth, accessControl.isCarOwner ], vehicleService.vehiclesAwaitingApproval );

// get all vehicles awaiting approval for a car owner
router.get( '/unassignedVehicles', [ auth, accessControl.isCarOwner ], vehicleService.unassignedVehicles );

// registration
router.post( '/register', [ auth, accessControl.isCarOwner ], vehicleService.registration );

// get all approved drivers without a vehicle drivers
router.get( '/driversWithoutVehicle', [ auth, accessControl.isCarOwner ], vehicleService.fetchApprovedDriversWithoutVehicle );


router.get('/trips/:vehicleId',[ auth, accessControl.isCarOwner ], vehicleService.fetchVehicleTripHistory);


// get vehicle details
router.get( '/:vehicleId', [ auth, accessControl.isCarOwner ], vehicleService.findOne );

// get vehicle details
router.get( '/drivers/:driverId', [ auth, accessControl.isCarOwner ], vehicleService.getDriverDetails );

// update vehicle details
router.put( '/:vehicleId', [ auth, accessControl.isCarOwner ], vehicleService.update );

// assign or UpdateDriver driver to a vehicle
router.put( '/assignDriver/:vehicleId', [ auth, accessControl.isCarOwner ], vehicleService.assignOrUpdateDriver );

// remove driver from a vehicle
router.put( '/removeDriver/:vehicleId', [ auth, accessControl.isCarOwner ], vehicleService.removeDriverFromVehicle );

// delete driver
router.delete( '/:vehicleId', [ auth, accessControl.isCarOwner ], vehicleService.delete );

module.exports = router;