const express = require('express'),
    router = express.Router(),
    vehicleTypeService = require('./service'),
    auth = require('../middlewares/auth'),
accessControl = require('../middlewares/accessControl');
    
// get all vehicle types Admins only
router.get( '/', [ auth ], vehicleTypeService.getAll );

// create vehicle type  super Admins only
router.post( '/', [ auth, accessControl.isSuperAdmin ], vehicleTypeService.create );

// get all vehicle types (for ride requests)
router.post( '/all', [ auth ], vehicleTypeService.getAllVehicleTypes );

// update a vehicle type Admins only
router.put( '/:vehicleTypeId', [ auth, accessControl.isSuperAdmin ], vehicleTypeService.update );

// delete vehicle type
router.delete( '/:vehicleTypeId', [ auth, accessControl.isSuperAdmin ], vehicleTypeService.delete );

module.exports = router;