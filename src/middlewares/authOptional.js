const jwt = require('jsonwebtoken'),
    responseMessage = require('../helpers/responseMessages'),
    dbQueries = require('../users/dbQueries');
require('dotenv').config();

module.exports = async function (req, res, next){
    try{
        if(req.headers.authorization){
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(" ")[1];            
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET ); 
            if(await dbQueries.getUserProfile(decoded._id) == null) return responseMessage.badRequest('invalid token', res);

            req.user = decoded;
        }
        next();

    } catch (ex){ return responseMessage.badRequest('invalid token', res); }
};
