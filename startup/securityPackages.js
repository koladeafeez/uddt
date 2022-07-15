const helmet = require('helmet'),
    compression = require('compression'),
    cors = require('cors'),
    rateLimit = require("express-rate-limit"),

limiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hr
    max: 500, // limit each IP to 500 requests per windowMs
    message: "Too many requests made from this IP, please try again after an hour"
});


module.exports= function (app) {
    app.use(cors( { exposedHeaders: ['Authorization', 'token'] } ));
    app.use(limiter);
    app.use(helmet());
    app.use(compression());
};