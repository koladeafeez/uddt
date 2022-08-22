const express = require('express'),
    errorHandler = require('../src/helpers/errorHandler'),
    customerRouter = require('../src/customers/router'),
    driverRouter = require('../src/drivers/router'),
    carOwnerRouter = require('../src/carOwners/router'),
    adminRouter = require('../src/admins/router'),
    vehicleRouter = require('../src/vehicles/router'),
    rideRequestRouter = require('../src/rideRequests/router'),
vehicleTypesRouter = require('../src/vehicleTypes/router');

module.exports = function (app) {
    app.use(express.json({ limit:"5mb" }));
    app.use(express.urlencoded({ limit:"5mb", extended: true }));
    app.use(errorHandler);                        

    app.use('/', express.Router().get("/api_v1/welcome", (req, res) => res.status(200).json({ 
        message: "Hi, I am Mopila.. and you are in my world!." })
    ));
    app.use('/api_v1/customers', customerRouter);
    app.use('/api_v1/drivers', driverRouter);
    app.use('/api_v1/carOwners', carOwnerRouter);
    app.use('/api_v1/admins', adminRouter);
    app.use('/api_v1/vehicles', vehicleRouter);
    app.use('/api_v1/rideRequests', rideRequestRouter);
    app.use('/api_v1/vehicleTypes', vehicleTypesRouter);
};