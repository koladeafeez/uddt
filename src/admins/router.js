const express = require("express"),
  router = express.Router(),
  adminService = require("./service"),
  reportsService = require("./reportsService"),
  accountManagementService = require('./AccountManagementServices/userAccountManagementServices'),
  auth = require("../middlewares/auth"),
accessControl = require("../middlewares/accessControl");

/* =====================================================================
                    Pilot phase reports
   ===================================================================== */
router.get("/pilotReports", adminService.getPilotUsageReports);
router.get("/pilotReports/getCongoDrivers", adminService.getCongoDrivers);
router.get("/pilotReports/getCongoCustomers", adminService.getCongoCustomers);

/* =====================================================================
                           Reports
===================================================================== */
// fetch active drivers
router.get("/reports/activeDrivers", [auth, accessControl.isAdmin], reportsService.getActiveDrivers);

// fetch a driver's trips
router.get("/reports/trips/driver/:driverId", [auth, accessControl.isAdmin], reportsService.getDriverTrips);

// fetch active customers
router.get("/reports/activeCustomers", [auth, accessControl.isAdmin], reportsService.getActiveCustomers);

// fetch a customer's trip history
router.get("/reports/trips/customer/:customerId", [auth, accessControl.isAdmin], reportsService.getCustomerTrips);

// fetch active carOwners
router.get("/reports/activeCarOwners", [auth, accessControl.isAdmin], reportsService.getActiveCarOwners);

/* =====================================================================
                    Currency Management services 
   ===================================================================== */
// create currency
// router.post( "/currency", [auth, accessControl.isSuperAdmin], adminService.createCurrency );

// seed currencies to DB
router.post( "/currency/seed", [auth, accessControl.isSuperAdmin], adminService.seedCurrency );

//get all currencies
router.get("/currency", [auth, accessControl.isAdmin], adminService.getCurrencies);

//get all currencies awaiting approval
router.get("/currency/approve", [auth, accessControl.isSuperAdmin], adminService.fetchCurrenciesForApproval);

//get approve or disapprove currency
router.put("/currency/approve/:currencyId", [auth, accessControl.isSuperAdmin], adminService.approveOrDisapproveCurrency);

//get single currency
router.get("/currency/:currencyId", [auth, accessControl.isAdmin], adminService.getSingleCurrency);

// update currency rate
router.put( "/currency/:currencyId", [auth, accessControl.isAdmin], adminService.updateCurrency );

/* =====================================================================
                    Admin Management services 
   ===================================================================== */

// create Admin
router.post( "/createAdmin", [auth, accessControl.isSuperAdmin], adminService.createAdmin );

// fetch all Admins
router.get("/", [auth, accessControl.isSuperAdmin], adminService.getAllAdmins);

// fetch single Admin details
router.get( "/:adminId", [auth, accessControl.isSuperAdmin], adminService.getSingleAdmin );

// update admin role
router.put( "/updateRole/:adminId", [auth, accessControl.isSuperAdmin], adminService.updateAdminRole );

// delete admin
router.delete( "/delete/:adminId", [auth, accessControl.isSuperAdmin], adminService.delete );

//user login
router.post("/login", adminService.login);

//email verification
router.put("/verifyEmail/:token", adminService.verifyEmail);

//regenerate email verification token
router.post( "/regenerateEmailVerificationToken", adminService.regenerateEmailVerificationMail );

//forgot password
router.post("/forgotPassword", adminService.forgotPassword);

//reset password
router.put("/resetPassword/:token", adminService.resetPassword);

/* =====================================================================
                    CarOwner Management services 
   ===================================================================== */

// get all carOwners
//router.get( "/carOwners/all", [auth, accessControl.isAdmin], adminService.getAllCarOwners );

// get carOwner details
router.get( "/carOwners/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnerDetails );

// get all vehicles registered by a carOwner
router.get( "/carOwners/vehicles/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnerVehicles );

// get a carOwner's approved vehicles
router.get("/carOwners/vehicles/approved/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnersApprovedVehicles);

// get a carOwner's disapproved vehicles
router.get("/carOwners/vehicles/disapproved/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnersDisapprovedVehicles);

// get a carOwner's vehicles pending approval or disapproval
router.get("/carOwners/vehicles/pending/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnersPendingVehicles);

// flag a CarOwner account for reactivation or suspension
router.put( "/carOwners/flag/:carOwnerId", [auth, accessControl.isAdmin], adminService.getCarOwnerVehicles );

/* =====================================================================
                    Customer Management services 
   ===================================================================== */

// get all carOwners
//router.get( "/customers/all", [auth, accessControl.isAdmin], adminService.getAllCustomers );

// get customer details
router.get( "/customers/:customerId", [auth, accessControl.isAdmin], adminService.getCustomerDetails );

/* =====================================================================
                    Driver Management services 
   ===================================================================== */

// get all drivers awaiting approval
router.get( "/drivers/awaitingApproval", [auth, accessControl.isAdmin], adminService.getDriversForApproval );

// approve/disapprove driver
router.put("/drivers/approveOrDisapprove/:driverId", [auth, accessControl.isAdmin], adminService.approveOrDisapproveDriver );

// get all approved drivers
router.get( "/drivers/approved", adminService.getApprovedDrivers );

// get all disapproved drivers
router.get( "/drivers/disapproved", [auth, accessControl.isAdmin], adminService.getDisapprovedDrivers );

// get all drivers
//router.get( "/drivers/all", [auth, accessControl.isAdmin], adminService.getAllDrivers );

// get a single driver details
router.get( "/drivers/:driverId", [auth, accessControl.isAdmin], adminService.getDriverDetails );

/* =====================================================================
                    Vehicle Management services 
   ===================================================================== */

// get all vehicles awaiting approval
router.get( "/vehicles/awaitingApproval", [auth, accessControl.isAdmin], adminService.getVehiclesForApproval );

// approve/disapprove driver
router.put( "/vehicles/:vehicleId", [auth, accessControl.isAdmin], adminService.approveOrDisapproveVehicle );

// get all approved vehicles
router.get( "/vehicles/approved", [auth, accessControl.isAdmin], adminService.getApprovedVehicles );

// get all disapproved vehicles
router.get( "/vehicles/disapproved", [auth, accessControl.isAdmin], adminService.getDisapprovedVehicles );

// get all vehicles
router.get( "/vehicles/all", [auth, accessControl.isAdmin], adminService.getAllVehicles );

// get a single driver details
router.get( "/vehicles/:vehicleId", [auth, accessControl.isAdmin], adminService.getVehicleDetails );

/* =====================================================================
                    Trip Management services 
   ===================================================================== */

// get all trips in progress
router.get( "/trips/inProgress", [auth, accessControl.isAdmin], adminService.getTripsInProgress );

// get a single trip details
router.put( "/trips/endTrip/:tripId", [auth, accessControl.isSuperAdmin], adminService.endTrip );

// get a single trip details
router.get( "/trips/:tripId", [auth, accessControl.isAdmin], adminService.getTripDetails );

/* =====================================================================
                    General Accounts Management services 
======================================================================== */
// flag customer
router.put( "/accounts/customers/flag/:customerId", [auth, accessControl.isAdmin], accountManagementService.flagCustomer );

// fetch flagged customer
router.get( "/accounts/customers/flagged", [auth, accessControl.isSuperAdmin], accountManagementService.fetchFlaggedCustomers );

// flag customer
router.put( "/accounts/customers/suspendOrActivateAccount/:customerId", [auth, accessControl.isSuperAdmin], accountManagementService.activateOrSuspendCustomer );

// flag driver
router.put( "/accounts/drivers/flag/:driverId", [auth, accessControl.isAdmin], accountManagementService.flagDriver );

// fetch flagged driver
router.get( "/accounts/drivers/flagged", [auth, accessControl.isSuperAdmin], accountManagementService.fetchFlaggedDrivers );

// flag driver
router.put( "/accounts/drivers/suspendOrActivateAccount/:driverId", [auth, accessControl.isSuperAdmin], accountManagementService.activateOrSuspendDriver );

// flag carOwner
router.put( "/accounts/carOwners/flag/:carOwnerId", [auth, accessControl.isAdmin], accountManagementService.flagCarOwner );

// fetch flagged carOwner
router.get( "/accounts/carOwners/flagged", [auth, accessControl.isSuperAdmin], accountManagementService.fetchFlaggedCarOwners );

// flag carOwner
router.put( "/accounts/carOwners/suspendOrActivateAccount/:carOwnerId", [auth, accessControl.isSuperAdmin], accountManagementService.activateOrSuspendCarOwner );


//Dashboard


// get all Customer Count

router.get( "/dashboard/getAll",[auth, accessControl.isAdmin], adminService.getAdminFullDashboard);

router.get( "/dashboard/getAllCustomersCount",[auth, accessControl.isAdmin], adminService.getAllCustomersCount);

router.get( "/dashboard/getAllUsersCount",[auth, accessControl.isAdmin], adminService.getAllUsersCount);

router.get( "/dashboard/getAllApprovedDriversCount",[auth, accessControl.isAdmin], adminService.getApprovedDriversCount);

router.get( "/dashboard/getAllApprovedVehiclesCount",[auth, accessControl.isAdmin], adminService.getApprovedVehiclesCount);

router.get( "/dashboard/getAllDriverPendingApprovalCount",[auth, accessControl.isAdmin], adminService.getDriversPendingApprovalCount);

router.get( "/dashboard/getAllVehiclePendingApprovalCount",[auth, accessControl.isAdmin], adminService.getVehiclePendingApprovalCount);



/* =====================================================================
                    User Management services 
   ===================================================================== */


   // fetch All Customer With Paginated
   router.get( "/user/Customers",[auth, accessControl.isAdmin], adminService.getAllCustomer);

   router.get( "/user/Customers/:customerId",[auth, accessControl.isAdmin], adminService.getCustomerDetails);

   router.get( "/user/customers/trips/:customerId",[auth, accessControl.isAdmin], adminService.getCustomerPastRides);


   router.get( "/user/Drivers",[auth, accessControl.isAdmin], adminService.getApprovedDrivers);

   router.get( "/user/Drivers/:driverId",[auth, accessControl.isAdmin], adminService.getDriverDetails);

   router.get( "/user/drivers/trips/:driverId",[auth, accessControl.isAdmin], adminService.getDriverPastRides);



   router.get( "/user/CarOwners",[auth, accessControl.isAdmin], adminService.getAllCarOwners);

   router.get( "/user/CarOwners/:carOwnerId",[auth, accessControl.isAdmin], adminService.getCarOwnerDetails);

   router.get( "/user/CarOwners/:carOwnerId/vehicles",[auth, accessControl.isAdmin], adminService.getCarOwnerVehicles);



module.exports = router;
