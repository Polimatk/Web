const router = require('./index.js');

server.web.get('/voting', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    res.render('pages/voting', {req: req, server: server, tab: 'voting'});
});