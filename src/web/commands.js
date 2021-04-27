server.web.get('/commands', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    return res.render('pages/commands', {req: req, server: server, tab: 'commands'});
});