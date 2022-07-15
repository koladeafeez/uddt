const mongoose = require("mongoose");

const CarOwnerAccountActivitySchema = new mongoose.Schema(
    {
        carOwnerId: { type: mongoose.Schema.Types.ObjectId,  ref: "CarOwner", index: true, required: true },
        adminId: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true, required: true },
        activity: {type: String, required: true},
        comment: String
    },
    { timestamps: true }
);

const CarOwnerAccountActivity = mongoose.model("CarOwnerAccountActivities", CarOwnerAccountActivitySchema);
exports.CarOwnerAccountActivity = CarOwnerAccountActivity;