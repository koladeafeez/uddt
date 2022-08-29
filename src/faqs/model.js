const mongoose = require('mongoose'),
    { Schema } = mongoose,
    Point = require('../helpers/pointSchema'),

    faqSchema = new Schema({
    question: {
        type: String, trim: true, index: {
            unique: true,
            partialFilterExpression: { question: { $type: "string" } }
        }
    },
    answer: {
        type: String, trim: true, index: {
            partialFilterExpression: { answer: { $type: "string" } }
        }
    },
    addedby: { type: mongoose.Schema.Types.ObjectId,  ref: "Admin", index: true, required: true },
    IsDeleted :{ type: Boolean, default: 0 },
    

}, { timestamps: true }),

Faq = mongoose.model('Faq', faqSchema);
exports.Faq = Faq;
