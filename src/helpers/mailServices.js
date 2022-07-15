const nodemailer = require('nodemailer'),
    hbs = require('nodemailer-express-handlebars');
require('dotenv').config();

let options = {
    viewEngine: {
        extName: '.hbs',
        partialsDir: './src/helpers/email-templates', // path to email templates are saved
        layoutsDir: '',
        defaultLayout: '',
    },
    viewPath: './src/helpers/email-templates', // path to email templates are saved
};

let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    //secure: false, // true for 465, false for other ports,
    secure : true,
    pool: true,
    rateLimit: 20,
    //secureConnection: false,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
    },
    //use the following lines if you are testing the endpoint offline
    tls:{
        ciphers:'SSLv3',
        rejectUnauthorized:false
         
    }
});
transporter.use('compile', hbs(options));

//email services
module.exports = {
    sendVerificationEmail: (user) => {
        const email = user.email;
        const data = {
            verifyUrl: `${process.env.FRONTEND_BASEURL}/verifyEmail/${user.email_verification_token}`, 
            baseUrl: `${process.env.FRONTEND_BASEURL}`, mailLogo: `${process.env.LOGO}`,
            instagramIcon: `${process.env.INSTAGRAM_ICON}`, twitterIcon: `${process.env.TWITTER_ICON}`, 
            linkedinIcon: `${process.env.LINKEDIN_ICON}`, facebookIcon: `${process.env.FACEBOOK_ICON}`            
        };
        const subject = "Email Verification.";
        const template = "emailVerification"; // name of template file
        module.exports.sendMail(email, subject, template, data);
    },

    sendPasswordResetEmail: (user) => {
        const email = user.email;
        const data = {
            passwordResetUrl: `${process.env.FRONTEND_BASEURL}/resetpassword/${user.passwordResetToken}`, name: user.firstName,
            baseUrl: `${process.env.FRONTEND_BASEURL}`, mailLogo: `${process.env.LOGO}`,
            instagramIcon: `${process.env.INSTAGRAM_ICON}`, twitterIcon: `${process.env.TWITTER_ICON}`, 
            linkedinIcon: `${process.env.LINKEDIN_ICON}`, facebookIcon: `${process.env.FACEBOOK_ICON}`            
        };
        const subject = "Password Reset";
        const template = "passwordReset"; // name of template file
        module.exports.sendMail(email, subject, template, data);
    },

    sendAdminChangePasswordEmail: (user) => {
        const email = user.email;
        const data = {
            passwordResetUrl: `${process.env.FRONTEND_BASEURL}/admin/resetpassword/${user.passwordResetToken}`, name: user.firstName,
            baseUrl: `${process.env.FRONTEND_BASEURL}`, mailLogo: `${process.env.LOGO}`,
            instagramIcon: `${process.env.INSTAGRAM_ICON}`, twitterIcon: `${process.env.TWITTER_ICON}`, 
            linkedinIcon: `${process.env.LINKEDIN_ICON}`, facebookIcon: `${process.env.FACEBOOK_ICON}`            
        };
        const subject = "Reset Your Password";
        const template = "resetPasswordReminderAdmin"; // name of template file
        module.exports.sendMail(email, subject, template, data);
    },

    sendAdminPasswordResetEmail: (user) => {
        const email = user.email;
        const data = {
            passwordResetUrl: `${process.env.FRONTEND_BASEURL}/admin/resetpassword/${user.passwordResetToken}`, name: user.firstName,
            baseUrl: `${process.env.FRONTEND_BASEURL}`, mailLogo: `${process.env.LOGO}`,
            instagramIcon: `${process.env.INSTAGRAM_ICON}`, twitterIcon: `${process.env.TWITTER_ICON}`, 
            linkedinIcon: `${process.env.LINKEDIN_ICON}`, facebookIcon: `${process.env.FACEBOOK_ICON}`            
        };
        const subject = "Password Reset";
        const template = "passwordReset"; // name of template file
        module.exports.sendMail(email, subject, template, data);
    },

    //email sending service
    sendMail: function(to, subject, template, data) {
        try
        {
        let mailOptions = {
            from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
            to: to,
            replyTo: process.env.MAIL_USERNAME,
            subject: subject,
            template: template,
            context: data
        };
        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return console.log(error);
            console.log('Mail sent: %s', info.messageId);
        });
    }catch(err){
console.log(err);
    }
    }
};