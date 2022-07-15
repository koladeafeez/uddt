const responseMessages = require('../../src/helpers/responseMessages');

module.exports = {
    globalErrorHandler: ( error, req, res, next ) => {
        const status = error.statusCode || 500;
        let message = "Ops!. Something went wrong.";

        console.log(error.message);
        return responseMessages.globalErrorReporter(message, status, res);
    },

    uncaughtExceptions: ( error, req, res, next ) => {
        const status = error.statusCode || 500;
        let message = "Ops!. Something went wrong.";

        console.log(error.message);
        return responseMessages.globalErrorReporter(message, status, res);
    },
}