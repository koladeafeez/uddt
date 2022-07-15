const express  = require('express'),
    app =  express(),
errorHandler = require('./startup/errorHandlers/errorHandler');

require('express-async-errors');
require('dotenv').config();
const port = process.env.PORT;




if (!process.env.PORT) { console.error('FATAL ERROR: App Port is not defined.'); process.exit(1); }
if (!process.env.JWT_SECRET) { console.error('FATAL ERROR: jwtPrivateKey is not defined.'); process.exit(1); }

// require('./startup/logging')();
require('./startup/securityPackages')(app);
require('./startup/db_connection');
require('./startup/router')(app);
app.use('/api_v1/uploads', express.static(__dirname + "/uploads"));

require('./startup/pageNotFound')(app);
app.use(errorHandler);

app.listen(port, () => console.log(`Listening on port ${port}...`));