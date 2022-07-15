const mongoose = require("mongoose");

const CustomerAccountActivitySchema = new mongoose.Schema(
    {
        customerId: { type: mongoose.Schema.Types.ObjectId,  ref: "Customer", index: true, required: true },
        adminId: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true, required: true },
        activity: { type: String, required: true },
        comment: String
    },
    { timestamps: true }
);

const CustomerAccountActivity = mongoose.model("CustomerAccountActivities", CustomerAccountActivitySchema);
exports.CustomerAccountActivity = CustomerAccountActivity;