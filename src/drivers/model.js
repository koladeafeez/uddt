const mongoose = require('mongoose'),
    { Schema } = mongoose,
    Point = require('../helpers/pointSchema'),

    driverSchema = new Schema({
    email: {
        type: String, trim: true, index: {
            unique: true,
            lowercase: true,
            partialFilterExpression: { email: { $type: "string" } }
        }
    },
    phone: {
        type: String, trim: true, index: {
            unique: true,
            partialFilterExpression: { phone: { $type: "string" } }
        }
    },
    password: String,
    firstName: String,
    lastName: String,
    country: String,
    profile_picture: String,
    drivers_license_front: String,
    drivers_license_back: String,
    otp: Number,
    otp_expires_on: Number,
    passwordResetOtp: Number,
    passwordResetOtp_expires_on: Number,
    isPhoneVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    hasVehicleAssigned: { type: Boolean, default: false },
    approvedOrDisapprovedBy: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true },
    approvedOrDisapprovedAt: Date,
    isOnline: { type: Boolean, default: true },
    isOnATrip: { type: Boolean, default: false },
    driver_coordinates: { type: Point, index: '2dsphere' },  // longitude first i.e. [longitude, latitude]
    role: { type: String, default: 'Driver' },
    deviceId: String,
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", index: true },
    vehicleTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "VehicleType", index: true },
    accountStatus: { type: String, default: "Active", enum: [ "Active", "Flagged for suspension", "Flagged for reactivation", "Suspended" ] },
}, { timestamps: true }),

Driver = mongoose.model('Driver', driverSchema);
exports.Driver = Driver;
