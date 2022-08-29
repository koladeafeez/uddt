const mongoose = require('mongoose'),
    { Schema } = mongoose;

    notificationSchema = new Schema({
    subject: {
        type: String, trim: true, index: {
            unique: true,
            partialFilterExpression: { question: { $type: "string" } }
        }
    },
    message: {
        type: String, trim: true, index: {
            partialFilterExpression: { message: { $type: "string" } }
        }
    },
    addedby: { type: mongoose.Schema.Types.ObjectId, index: true, required: true },
    role: { type: String, default: 'Admin' },
    sender: {type : String},
    hasRead : {type:Boolean, default : 0},
    isDeleted :{ type: Boolean, default: 0 },
    deletedBy : { type: mongoose.Schema.Types.ObjectId, index: true },
    recipent:{ type: mongoose.Schema.Types.ObjectId, required : true },
    recipentRole : { type: String, default: 'Admin' , enum: [ "Admin", "Car Owner", "Driver", "Customer" ]},

}, { timestamps: true }),

Notification = mongoose.model('Notification', notificationSchema);
exports.Notification = Notification;
