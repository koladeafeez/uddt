const { string } = require('@hapi/joi');

const mongoose = require('mongoose'),
    { Schema } = mongoose,

customerSchema = new Schema({
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
    payment_mode: { type: Array, default: ["Cash"] },
    currency: String,
    otp: Number,
    otp_expires_on: Number,
    passwordResetOtp: Number,
    passwordResetOtp_expires_on: Number,
    isPhoneVerified: { type: Boolean, default: 0 },
    role: { type: String, default: 'Customer' },
    deviceId: String,
    accountStatus: { type: String, default: "Active", enum: [ "Active", "Flagged for suspension", "Flagged for reactivation", "Suspended" ] },
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);
exports.Customer = Customer;
