const jwt = require('jsonwebtoken'),
    { Customer } = require('../customers/model'),
    { Driver } = require('../drivers/model'),
    { Admin } = require('../admins/model'),
    { CarOwner } = require('../carOwners/model'),
    responseMessage = require('../helpers/responseMessages'),
    mongoose = require('mongoose');
require('dotenv').config();

module.exports = async function (req, res, next){
    try{
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(" ")[1];            
        }
        if(!token) return responseMessage.unauthorized('Kindly login to continue', res);

        const decoded = jwt.verify(token, process.env.JWT_SECRET ); 
        if (!mongoose.Types.ObjectId.isValid(decoded._id)) return responseMessage.badRequest('invalid token.', res);

        const customer = await Customer.findOne({_id: decoded._id}),
            driver = await Driver.findOne({_id: decoded._id}),
            carOwner = await CarOwner.findOne({_id: decoded._id}),
            admin = await Admin.findOne({_id: decoded._id, isDeleted: false});
        if( !customer && !driver && !admin && !carOwner ) return responseMessage.badRequest('invalid token.', res);
        
        req.user = decoded;
        next();

    } catch (ex){ 
        if(ex.name === 'CastError') return responseMessage.notFound('Invalid user.', res);
        return responseMessage.badRequest('invalid token', res); 
    }
};
