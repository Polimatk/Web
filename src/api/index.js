server.api = require('express').Router();

server.api.get('/', function(req, res) {
    res.send('{"api":"works!"}');
});
