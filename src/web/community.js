const {Guild} = require('../shared');

server.web.get(['/@:slug', '/@:slug/:page'], function(req, res, next) {
    var error, profile;
    server.pool.query('SELECT * FROM guilds WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(results.length) {
            profile = new Guild(results[0]);
            return res.render('pages/community', {req: req, server: server, tab: null,
                profile: profile,
                error: error
            });
        }
        return next();
    });
});