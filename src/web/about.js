server.web.get(['/about', '/about/:section'], function(req, res) {
    return res.render('pages/about', {req: req, server: server, tab: 'about',
        section: req.params.section || null
    });
});