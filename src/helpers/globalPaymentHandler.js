const fetch =  require('node-fetch');
const { stringSanitizer } = require('./subroutines');
require('dotenv').config();

const mpesaRequestheader = { 
    'Content-Type': 'application/json',
    'Authorization': process.env.AUTHORIZATION,
    'SignatureMethod': process.env.SIGNATURE_METHOD,
    'Nonce': process.env.NONCE,
    'Signature': process.env.SIGNATURE,
    'Timestamp': process.env.TIMESTAMP,
};

module.exports = {
    mpesa: async (phone, amount, currency) => {
        const phoneNumber = stringSanitizer(phone);
        const url = 'http://178.128.74.190/api/B2C';
        if(!currency) currency = 'USD'; // CDF for congo DR currency and USD for US dollar.. dollar is the base currency.

        const mpesa = await fetch(url, { 
            method: 'POST', 
            headers: mpesaRequestheader,
            body: JSON.stringify({
                customerPhoneNumber: phoneNumber.toString(),
                amount: amount,
                transactionReference: process.env.MPESA_TRANSACTION_REFERENCE,
                currency: currency
            }) 
        });
        const data = await mpesa.json();
        if(!data.status) return data;

        // verify payment
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(mpesaPaymentEnquiry(data.insightReference));
            }, 5000);
        });
    }
};

function mpesaPaymentEnquiry(transactionReference) {
    const url = `http://178.128.74.190/api/PaymentRequery`;

    return fetch(url, { 
        method: 'POST', 
        headers: mpesaRequestheader,
        body: JSON.stringify({
            transactionReference
        }) 
    }).then(res => res.json())
    .catch(err => { 
        console.log(err);
        return err; 
    });
}