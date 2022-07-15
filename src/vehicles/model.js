const mongoose = require('mongoose'),
    { Schema } = mongoose,

vehicleSchema = new Schema({
    plate_number: {
        type: String, trim: true, index: {
            unique: true,
            partialFilterExpression: { plate_number: { $type: "string" } }
        }
    },
    vehicleTypeId: { type: mongoose.Schema.Types.ObjectId,  ref: "VehicleType", index: true, required: true },
    // vehicle_type: { type: String, default: "Saloon", enum: [ "Saloon", "SUV", "Van", "Mini Van" ] },
    vehicle_name: String,
    model_and_year: String,
    registration_certificate: String,
    certificate_of_inspection: String,
    insurance_certificate: String,
    vehicle_image_front_view: String,
    vehicle_image_back_view: String,
    isApproved: { type: Boolean, default: false },
    approvedOrDisapprovedBy: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true },
    approvedOrDisapprovedAt: Date,
    driverId: { type: mongoose.Schema.Types.ObjectId,  ref: "Driver", index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId,  ref: "CarOwner", index: true, required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: Date,
}, { timestamps: true });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
exports.Vehicle = Vehicle;