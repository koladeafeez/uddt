const mongoose = require('mongoose'),
    { Schema } = mongoose,

adminSchema = new Schema({
    email: {
        type: String, trim: true, index: {
            unique: true,
            lowercase: true,
            partialFilterExpression: { email: { $type: "string" } }
        }
    },
    password: String,
    firstName: String,
    lastName: String,
    country: String,
    profile_picture: String,
    passwordResetToken: String,
    passwordResetToken_expires_on: Number,
    isEmailVerified: { type: Boolean, default: false },
    email_verification_token: String,
    email_verification_token_expires_on: Number,
    role: { type: String, default: 'Admin' },
    needsPasswordReset: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);
exports.Admin = Admin;
