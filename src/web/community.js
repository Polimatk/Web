const {Guild} = require('../shared');

server.web.get('/@:slug', function(req, res) {
    var error, profile, joined = undefined;
    server.pool.query('SELECT * FROM guilds WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(errors || !results.length) {
            error = 'User or community not found.';
        }
        else {
            profile = new Guild(results[0]);
        }
        res.render('pages/community', {req: req, server: server, tab: null,
            profile: profile,
            error: error
        });
    });
});