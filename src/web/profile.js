const {User, Guild} = require('../shared');
const prettydate = require('pretty-date');

server.web.get('/profile', function(req, res) {
    if(!req.isAuthenticated()) return res.redirect('/');
    if(req.user.slug) return res.redirect('/@' + req.user.slug);
    return res.render('pages/setup', {req: req, server: server, tab: null,
        setupSteps: User.setupSteps
    });
});
server.web.post('/profile', function(req, res) {
    if(!req.isAuthenticated()) return res.redirect('/');
    var success, error = undefined;
    if('slug' in req.body) {
        if(req.body.slug && new RegExp(/[A-Za-z0-9-_]{3,32}/).test(req.body.slug)) {
            req.user.slug = req.body.slug;
            req.user.save(function(errors) {
                if(!errors) success = 'Your shiny new URL was created! <a href="/@' + req.body.slug + '">Check it out</a>';
                else error = errors;
                return res.render('pages/setup', {req: req, server: server, tab: null,
                    setupSteps: User.setupSteps,
                    success: success,
                    error: error
                });
            });
        }
        else {
            return res.render('pages/setup', {req: req, server: server, tab: null,
                setupSteps: User.setupSteps,
                success: success,
                error: 'Custom URL must be 3-32 letters, numbers, underscores, and hyphens only.'
            });
        }
    }
    else {
        return res.redirect('/profile');
    }
});

server.web.get('/@:slug', function(req, res, next) {
    var error, profile, joined = undefined;
    server.pool.query('SELECT * FROM users WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(!results.length) return next();
        let profile = new User(results[0]);
        let guilds = [];
        let joined = prettydate.format(new Date(Date.parse(profile.joined)));
        for(let i = 0; i < profile.discordProfile.guilds.length; i++) {
            if((profile.discordProfile.guilds[i].permissions & 0x20) == 0x20) {
                Guild.findOrCreate(profile.discordProfile.guilds[i], function(error, guild) {
                    guilds.push(guild);
                });
            }
        }
        setTimeout(function() {
            return res.render('pages/profile', {req: req, server: server, tab: null,
                profile: profile,
                joined: joined,
                error: error,
                guilds: guilds
            });
        }, 10);
    });
});