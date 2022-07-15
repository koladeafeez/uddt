const mongoose = require("mongoose"),
  { Schema } = mongoose,
  currencyExchangeRateSchema = new Schema(
    {
      currency: {
        type: String,
        trim: true,
        index: {
          unique: true,
          partialFilterExpression: { currency: { $type: "string" } },
        },
      },
      approvedRate: Number, // against the USD
      newRate: Number, // against the USD
      isNewRateUpdated: { type: Boolean, default: false },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true, required: true },
      lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", index: true },
    },
    { timestamps: true }
  );

const CurrencyExchangeRate = mongoose.model( "CurrencyExchangeRate", currencyExchangeRateSchema );
exports.CurrencyExchangeRate = CurrencyExchangeRate;
