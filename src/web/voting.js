const [app, config] = require('../server.js');
const router = require('./index.js');

router.get('/voting', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    res.render('pages/voting', {req: req, config: config, tab: 'voting'});
});