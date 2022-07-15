const mongoose = require("mongoose");

const DriverAccountActivitySchema = new mongoose.Schema(
    {
        driverId: { type: mongoose.Schema.Types.ObjectId,  ref: "Driver", index: true, required: true },
        adminId: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true, required: true },
        activity: {type: String, required: true},
        comment: String
    },
    { timestamps: true }
);

const DriverAccountActivity = mongoose.model("DriverAccountActivities", DriverAccountActivitySchema);
exports.DriverAccountActivity = DriverAccountActivity;