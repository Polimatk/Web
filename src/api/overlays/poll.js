server.api.get('/overlays/poll', function(req, res) {
    res.set('Content-Type', 'text/html');
    res.render('overlays/poll', {req: req, server: server});
});