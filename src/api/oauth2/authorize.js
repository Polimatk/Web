server.api.get('/oauth2/authorize', function(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.render('pages/authorize', {req: req, server: server});
});