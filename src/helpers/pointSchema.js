const mongoose = require('mongoose'),
  { Schema } = mongoose,

pointSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true
  },
  coordinates: {
    type: [Number],   // longitude first before latitude  eg [longitude, latitude]
    required: true
  },
}),

Point = mongoose.model('Point', pointSchema);
exports.Point = Point;