const [app, config] = require('../server.js');
const router = require('express').Router();

router.get('/', function(req, res) {
    res.send('{"api":"works!"}');
});

module.exports = router;