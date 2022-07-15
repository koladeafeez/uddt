const winston = require('winston');
require('dotenv').config();
require ('express-async-errors');

module.exports = function () {
    //logs uncaught exceptions outside express
    winston.exceptions.handle()(  
        new winston.transports.File({filename:'uncaughtexceptions.log'}),
        new winston.transports.Console({colorize:true, prettyPrint:true}),
    );

    //logs promise rejections
    process.on('unhandledRejection', (ex)=>{
        throw ex;
    });

    //Logs errors globally
    winston.add(winston.transports.File, { filename: 'logfile.log' });
};