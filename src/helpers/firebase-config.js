const admin = require("firebase-admin"),
serviceAccount = require("./jango-d944e-firebase-adminsdk-xl9t1-041463e5b8.json");

require('dotenv').config();


admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const notification_options = {
  priority: "high",
  timeToLive: 60 * 60 * 24
};

module.exports = {
  sendNotification: (userDeviceId, message, data) => {  
    const payload = {
      "data": data,
      "notification":{
        "body": message.body,
        "title": message.title
      }
    };
  
    admin.messaging().sendToDevice(userDeviceId, payload, notification_options)
    .then( response => { console.log(response.results); })
    .catch( error => { console.log(error.errorInfo); });
  }
};