const {Guild} = require('../shared');

server.web.get(['/@:slug', '/@:slug/:page'], function(req, res, next) {
    var error, profile, commands;
    server.pool.query('SELECT * FROM guilds WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(results.length) {
            profile = new Guild(results[0]);
            server.pool.query('SELECT * FROM commands WHERE guild = ?', [profile.discordId], function(errors, results) {
                commands = results;
                return res.render('pages/community', {req: req, server: server, tab: null,
                    profile: profile,
                    commands: commands,
                    error: error
                });
            });
        }
        else {
            return next();
        }
    });
});