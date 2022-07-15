const responseMessages = require('../../src/helpers/responseMessages');
require('dotenv').config();

module.exports = function errorHandler ( error, req, res, next ) {
    const status = error.statusCode || 500;
    let message = "Ops!. Something went wrong.";

    if(process.env.NODE_ENV == 'development') {
        console.log(error);
    }else{
        console.log(error.message);
    }    
    return responseMessages.globalErrorReporter(message, status, res);
};