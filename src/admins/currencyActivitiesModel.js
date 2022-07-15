const mongoose = require("mongoose");

const CurrencyActivitySchema = new mongoose.Schema(
    {
        currencyId: { type: mongoose.Schema.Types.ObjectId,  ref: "CurrencyExchangeRate", index: true, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true, required: true },
        currencyActivity: String,
        message: String
    },
    { timestamps: true }
);

const CurrencyActivity = mongoose.model("CurrencyActivities", CurrencyActivitySchema);
exports.CurrencyActivity = CurrencyActivity;