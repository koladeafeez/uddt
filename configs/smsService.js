const fetch = require('node-fetch');
require('dotenv').config();

async function sendSMS(phoneNumber, smsContent) {
    const credentials = {
        // apiKey: process.env.AFRICASTALKING_SMS_API_KEY,
        apiKey: process.env.AFRICASTALKING_SANDBOX_API_KEY,         // use your sandbox app API key for development in the test environment
        username: 'sandbox',      // use 'sandbox' for development in the test environment
    };
    const Africastalking = require('africastalking')(credentials);
    
    // Initialize a service e.g. SMS
    const sms = Africastalking.SMS;
    
    // Use the service
    const options = {
        to: phoneNumber,
        message: smsContent,
        // from: 'Yango',
        enqueue: true
    };
    
    // Send message and capture the response or error
    const smsResponse = await sms.send(options)
        .then( response => { console.log(`sms sent to ${phoneNumber}`); console.log(response); })
        .catch( error => { console.log(error); });
}

// async function sendSMS(phoneNumber, smsContent){
//     //Note: The phoneNumber number should not have a + character.
//     const smsResponse = await fetch(`http://websms.ipintegrated.com/HTTPIntegrator_SendSMS_1?u=LLEVAR&p=57vtbiuf&s=LLEVAR&r=t&f=f&d=${phoneNumber}&t=${smsContent}`,                                     
//         { method: "POST", headers: { "Content-Type": "application/json" } }
//     ).then(console.log('sms sent to ' + phoneNumber))
//     .then((data) => data)
//     .catch((err) => console.log(err));

//     // console.log(smsResponse);
// }

// async function  sendSMS(phoneNumber, smsContent) {
//     const apiKey = process.env.AFRICASTALKING_SMS_API_KEY;
//     const smsResponse = await fetch(`https://api.africastalking.com/version1/messaging`,                                     
//         { 
//             method: "POST", 
//             headers: { 
//                 "Accept": "application/json",
//                 "Content-Type": "application/x-www-form-urlencoded",
//                 "apiKey": apiKey
//             },
//             data: {
//                 "username": "Yango",
//                 "from": "Yango",
//                 "to":phoneNumber,
//                 "message": smsContent
//             }
//         }
//     ).then(console.log('sms sent to ' + phoneNumber))
//     .catch((err) => console.log(err));

//     console.log(smsResponse);
//     return smsResponse;
// }

module.exports = {
    sendSMS
};