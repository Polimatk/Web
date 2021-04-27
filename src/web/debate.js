const [app, config] = require('../server.js');
const router = require('./index.js');

router.get('/debate', function(req, res) {
    res.render('pages/debate', {req: req, config: config, tab: 'debate'});
})