const mongoose = require('mongoose'),
    { Schema } = mongoose,

vehicleTypeSchema = new Schema({
    vehicle_type: {
        type: String, trim: true,         
        index: {
            unique: true,
            partialFilterExpression: { vehicle_type: { $type: "string" } }
        }
    },
    base_charge: Number,       // amount in US Dollars
    picture: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true, required: true },
    tripCharge: Number,
    currency: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
}, { timestamps: true }),

VehicleType = mongoose.model('VehicleType', vehicleTypeSchema);
exports.VehicleType = VehicleType;