
const mongoose = require('mongoose'),
{ Schema } = mongoose,
Point = require('../helpers/pointSchema'),


estimatePriceSchema = new Schema({
    pickup_coordinates: { type: Point, index: '2dsphere', required: true},    // longitude first i.e. [longitude, latitude]
    destination_coordinates: { type: Point, index: '2dsphere', required: true},   // longitude first i.e. [longitude, latitude]
    pickup_location: { type: String, required: true },
    destination: { type: String, required: true },
    vehicleTypeId: { type: mongoose.Schema.Types.ObjectId,  ref: "VehicleType", index: true},
    calculated_distance: String,
    calculated_raw_distance: Number, // in meters
    final_distance: String,
    final_distanceValue: Number,  // in meters
    calculated_duration: String,
    calculated_raw_duration: Number,  //in seconds
    final_duration: String,
    final_durationValue: Number,  // in seconds
    calculated_amount: Number,  // in dollars
    final_amount: Number, // in dollars
    paymentStatus: { type: String, default: "NotPaid", enum: [ "Paid", "NotPaid" ] },
    trip_started_at: Date,
    trip_ended_at: Date,
    trip_status: { type: String, default: "Pending", enum: [ "Pending", "InProgress", "Ended", "Cancelled" ] },
    modeOfPayment: { type: String, default: "Cash", enum: ['Cash', 'Transfer','Card'] },
    currency: String,
    isPaymentConfirmed: { type: Boolean, default: false },
    payment_confirmed_at: Date,
    driverId: { type: mongoose.Schema.Types.ObjectId,  ref: "Driver", index: true },
    vehicle_plate_number: String,
    vehicleId: { type: mongoose.Schema.Types.ObjectId,  ref: "Vehicle", index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId,  ref: "Customer", index: true, required: true }, 
    tripEndedBy: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true },  
}, { timestamps: true }),



estimatedPrice = mongoose.model('EstimatedPrice', estimatePriceSchema);

exports.EstimatedPrice = estimatedPrice;