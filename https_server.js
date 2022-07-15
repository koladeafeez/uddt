const express = require('express'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),
    app = express();

app.use('/', (req, res, next) => {
    res.send("Howdy!..");
});

const sslServer = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, 'cert', 'key.pem')),
        cert: fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'))
    },
    app
);

sslServer.listen(8443, () => console.log('secure server on port 8443'));
