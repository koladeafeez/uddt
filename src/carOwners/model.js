const mongoose = require('mongoose'),
    { Schema } = mongoose,

carOwnerSchema = new Schema({
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
    passwordResetToken: String,
    passwordResetToken_expires_on: Number,
    isEmailVerified: { type: Boolean, default: 0 },
    email_verification_token: String,
    email_verification_token_expires_on: Number,
    role: { type: String, default: 'Car Owner' },
    accountStatus: { type: String, default: "Active", enum: [ "Active", "Flagged for suspension", "Flagged for reactivation", "Suspended" ] },
}, { timestamps: true });

const CarOwner = mongoose.model('CarOwner', carOwnerSchema);
exports.CarOwner = CarOwner;
