const _ = require("lodash"),
  validate = require("./validation"),
  responseMessage = require("../helpers/responseMessages"),
  variables = require("../helpers/parameters"),
  mongoose = require("mongoose"),
  { VehicleType } = require("./model"),
  helpers = require("../helpers/subroutines"),
  { Customer } = require("../customers/model");
const { CurrencyExchangeRate } = require("../admins/currencyModel");

module.exports = {
  getAll: async (req, res) => {
    const vehicleTypes = await VehicleType.find({ isDeleted: false }).select( variables.vehicleTypeDetails );
    if (vehicleTypes.length == 0) return responseMessage.notFound("No vehicle types found", res);

    return responseMessage.success("Listing all vehicle types", vehicleTypes, res);
  },

  getAllVehicleTypes: async (req, res) => {
    const { error } = validate.getAll(req.body);
    if (error) return responseMessage.badRequest(error.details[0].message, res);

    const currencyExchangeRate = await CurrencyExchangeRate.findOne({currency: req.body.currency});
    if(!currencyExchangeRate) return responseMessage.badRequest('Invalid currency', res);

    const vehicleTypes = await VehicleType.find({ isDeleted: false }).select( variables.vehicleTypeDetails );
    if (vehicleTypes.length == 0) return responseMessage.notFound("No vehicle types found", res);

    //calculate tripcharge for each vehicle type using the provided coordinates
    const matrixData = await helpers.getDistanceAndTime( req.body.pickupLocation, req.body.destination );
    vehicleTypes.forEach(vehicleType => {
      const tripCharge = helpers.getTripAmountByVehicleType(matrixData, vehicleType.base_charge, req.body.currency, currencyExchangeRate.approvedRate);
      vehicleType.tripCharge = tripCharge;
      vehicleType.currency = req.body.currency;
      return vehicleType;
    });
  
  return responseMessage.success('Listing all vehicle types', vehicleTypes, res);
  },

  create: async (req, res) => {
    const { error } = validate.create(req.body);
    if (error) return responseMessage.badRequest(error.details[0].message, res);

    const vehicleTypeExist = await VehicleType.findOne({
      vehicle_type: req.body.vehicle_type,
    });
    if (vehicleTypeExist)
      return responseMessage.badRequest("Vehicle type already exists", res);

    const vehicleType = new VehicleType(
      _.pick(req.body, variables.vehicleTypeDetails)
    );
    vehicleType.createdBy = req.user._id;
    await vehicleType.save();

    const data = _.pick(vehicleType, variables.vehicleTypeDetails);
    return responseMessage.created("Your vehicle been registered!", data, res);
  },

  update: async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.vehicleTypeId))
      return responseMessage.notFound("The vehicle type does not exist.", res);
    const { error } = validate.update(req.body);
    if (error) return responseMessage.badRequest(error.details[0].message, res);

    let vehicleType = await VehicleType.findById(req.params.vehicleTypeId);
    if (!vehicleType)
      return responseMessage.notFound("Vehicle type does not exist.", res);

    let somethingChanged = false;
    if (vehicleType.base_charge !== req.body.base_charge) {
      vehicleType.base_charge = req.body.base_charge;
      somethingChanged = true;
    }

    if (vehicleType.vehicle_type !== req.body.vehicle_type) {
      vehicleType.vehicle_type = req.body.vehicle_type;
      somethingChanged = true;
    }

    if (somethingChanged) {
      vehicleType.updatedBy = req.usser._id;
      await vehicle.save();

      const data = _.pick(vehicleType, variables.vehicleTypeDetails);
      return responseMessage.success(
        "Vehicle type updated successfully!",
        data,
        res
      );
    }

    const data = _.pick(vehicleType, variables.vehicleTypeDetails);
    return responseMessage.success("Nothing to update", data, res);
  },

  delete: async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.vehicleTypeId))
      return responseMessage.notFound("Invalid vehicle type.", res);
    const vehicleType = await VehicleType.findById(req.params.vehicleTypeId);
    if (!vehicleType)
      return responseMessage.notFound("Invalid vehicle type.", res);

    vehicleType.isDeleted = true;
    vehicleType.deletedAt = Date.now();
    await vehicleType.save();

    return responseMessage.success(
      "vehicle type deleted sucessfully!",
      null,
      res
    );
  },
};