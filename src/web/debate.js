server.web.get('/debate', function(req, res) {
    res.render('pages/debate', {req: req, server, tab: 'debate'});
});