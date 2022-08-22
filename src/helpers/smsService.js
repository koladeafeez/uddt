require('dotenv').config();

async function sendSMS(phoneNumber, smsContent) {
    const credentials = {
        apiKey: process.env.AFRICASTALKING_SMS_API_KEY,
        username: 'Yango'
    },
    Africastalking = require('africastalking')(credentials),   
    sms = Africastalking.SMS,  
    options = {
        to: phoneNumber,
        message: smsContent,
        // from: 'MopilaApp',
        enqueue: true
    },
    smsResponse = await sms.send(options)
        .then( response => { console.log(`sms sent to ${phoneNumber}`); console.log(response); })
        .catch( error => { console.log(error); 
    });
}

module.exports = {
    sendSMS
};