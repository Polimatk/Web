const [app, config] = require('../server.js');
const router = require('./index.js');

router.get('/commands', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    return res.render('pages/commands', {req: req, config: config, tab: 'commands'});
});