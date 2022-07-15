const winston = require('winston');

module.exports = function (err, req, res, next) {
    winston.error(err);
    console.log(err.message);

    if(err.name === 'CastError') {
        return res.status(404).json({
            success: false,
            message: "Invalid ID"
        });
    }  
    // if (err.errors[0].message == "username must be unique") {
    //     return res.status(400).send({ success: false, message:"username already taken"});
    // }

    return res.status(500).json({
        success: false,
        message: "An error occurred while processing your request," + err.message,
    });
};