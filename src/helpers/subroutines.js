const jwt = require('jsonwebtoken'),
    Chance = require('chance'),
    chance = new Chance(),
    distanceMatrix = require('google-distance'),
    _ = require('lodash'),
    variables = require('../helpers/parameters'),
    responseMessage = require('../helpers/responseMessages'),
    { CurrencyExchangeRate } = require('../admins/currencyModel'),
{ Driver } = require('../drivers/model');

require('dotenv').config();

function generateAuthToken(user) {
    const token = jwt.sign({_id: user.id, role: user.role}, process.env.JWT_SECRET);
    return token;
}

function generateEmailVerificationToken(email) {
    const token = jwt.sign({email: email}, process.env.JWT_SECRET);
    return token;
}

function generateOTP() {
    return chance.string({ length: 4, alpha: false, numeric: true });
}

function generateRideOrderId() {
    return chance.string({ length: 16, casing: 'upper', alpha: true, numeric: true });
}

// custom
function getDistance(rideRequest, unit) {
    if (
        (rideRequest.pickup_latitude == rideRequest.destination_latitude) && 
        (rideRequest.pickup_longitude == rideRequest.destination_longitude)
    ) return 0;
    
    let radPickupLatitude = Math.PI * rideRequest.pickup_latitude / 180,
        radDestinationLatitude = Math.PI * rideRequest.destination_latitude / 180,
        theta = rideRequest.pickup_longitude - rideRequest.destination_longitude,
        radtheta = Math.PI * theta / 180,
        distance = Math.sin(radPickupLatitude) * Math.sin(radDestinationLatitude) + Math.cos(radPickupLatitude) * 
            Math.cos(radDestinationLatitude) * Math.cos(radtheta);
    
    if (distance > 1)  distance = 1;
    distance = Math.acos(distance) * 180 / Math.PI;
    distance = distance * 60 * 1.1515;  // distance in Miles
    
    if (unit=="km") distance = distance * 1.609344; // distance in kilometers
    if (unit=="N") distance = distance * 0.8684;  // distance in Nautical miles.. Ok.. this is me showing off :)

    distance = distance.toFixed(2);
    return distance;
}

// calculate distance and time using google distance matrix API
function getDistanceAndTime(origin, destination){
    distanceMatrix.apiKey = process.env.GOOGLE_API_KEY;

    return new Promise((resolve, reject) => {
        distanceMatrix.get(
        {
            index: 1,
            origin: `${origin[1]}, ${origin[0]}`, // [0] = longitude, [1] = latitude
            destination: `${destination[1]}, ${destination[0]}`,
            mode: 'driving',
        },
        function (err, data) {
            if (err) {
                console.log(err);
                return reject(err);
            }
            // console.log(data);
            return resolve(data);
        });
    });
}

//fetch all drivers in a pickup area
async function fetchDrivers(pickup_coordinates, vehicleType, radius){
    const drivers = await Driver.find({
        driver_coordinates: {
          $near: {
            $geometry: {
               type: "Point" ,
               coordinates: pickup_coordinates
            },
            $maxDistance: radius, //distance in meters (eg 1000000 = 1000 km radius)
            // $minDistance: <distance in meters>
          }
        },
        isOnline: true,
        isApproved: true,
        hasVehicleAssigned: true,
        // vehicleTypeId: vehicleType,
        isOnATrip: false
    });

    return drivers;
}

async function getDriversInPickUpArea(rideRequest, radius, req, res){
    let drivers = await fetchDrivers(rideRequest.pickup_coordinates, req.body.vehicleTypeId, radius);

    // continually increase the query radius by 2km until a driver is found or radius is equal to 9km
    while (drivers.length == 0 && radius != 9000) {
        radius += 2000;
        drivers = await fetchDrivers(rideRequest.pickup_coordinates, req.body.vehicleType, radius);
    }

    if(drivers.length == 0 && radius == 9000) {
        rideRequest.trip_status = 'Cancelled';
        await rideRequest.save();

        rideRequest = _.pick(rideRequest, variables.rideRequestDetails);
        return responseMessage.partialContent('Sorry, no driver was found in your area.', rideRequest, res);
    }
    return drivers;
}

function calculateFinalTripDuration(startTime, endTime){
    // get total seconds between the times
    let delta = Math.abs(endTime - startTime) / 1000;

    // calculate (and subtract) whole days
    let days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    let hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    let minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    // what's left is in seconds
    let seconds = Math.floor(delta % 60);

    let duration = {};
    duration.duration = '';
    if(days != 0) duration.duration = `${days}days`;
    if(hours != 0) duration.duration += ` ${hours}hrs`;
    if(minutes != 0) duration.duration += ` ${minutes}mins`;
    if(seconds != 0) duration.duration += ` ${seconds}secs`;
    duration.durationValue = Math.abs(endTime - startTime) / 1000;  // time in seconds
    
    return duration;
}

function getTimeDifference(startTime, endTime){
    return Math.abs(endTime - startTime) / 1000;
}


/*                                      TRIP AMOUNT CALCULATION
    Formular 
    vehicle base charge + (rate/km(i.e. $0.10) * total distance covered in km) + (peak period(i.e. $0.80) * total time taken in minutes ) 
    + ride completion fee(i.e. $1.00) 

   NB: remember to add out of range driver consideration charge i.e. $1 later  
*/
async function calculateTripAmount(distance, duration, currency){
    const distanceInKM = distance / 1000;
    const durationInMinutes = duration / 60;
    let tripAmount = 2 + (0.10 * distanceInKM) + (durationInMinutes * 0.08);

    if(currency !== 'USD') {
        const currencyRate = await CurrencyExchangeRate.findOne({currency: currency});
        tripAmount = tripAmount * currencyRate.approvedRate;
    }

    return Math.round(tripAmount.toFixed(2));
}
 
function getTripAmountByVehicleType(matrixData, vehicleBaseCharge, currency, currencyRate){
    const distanceInKM = matrixData.distanceValue / 1000;
    const durationInMinutes = matrixData.durationValue / 60;
    let tripAmount = vehicleBaseCharge + (distanceInKM * 0.10) + (durationInMinutes * 0.08);

    if(currency !== 'USD') tripAmount = tripAmount * currencyRate;
    return Math.round(tripAmount.toFixed(2));
}

// remove special characters from a string
function stringSanitizer(string) {
    string = string.replace(/[^a-z0-9áéíóúñü \.,_-]/gim, "");
    return string.trim();
}

//add days to date
Date.prototype.addDays = function(days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};
// use this variable only when you want to add days or remove days from a date. Otherwise, use the normal new Date()
let getCurrentDate = new Date();

module.exports = {
    generateAuthToken, generateEmailVerificationToken, generateOTP, getCurrentDate, generateRideOrderId, getDistance, getDistanceAndTime,
    getDriversInPickUpArea, calculateFinalTripDuration, calculateTripAmount, getTripAmountByVehicleType, stringSanitizer
};