const [app, config] = require('../server.js');
const router = require('./index.js');
const shared = require('../shared');
const prettydate = require('pretty-date');

router.get('/profile', function(req, res) {
    if(!req.isAuthenticated()) return res.redirect('/');
    if(req.user.slug) return res.redirect('/@' + req.user.slug);
    return res.render('pages/profileSetup', {req: req, config: config, tab: null,
        setupSteps: shared.User.setupSteps,
    });
});
router.post('/profile', function(req, res) {
    if(!req.isAuthenticated()) return res.redirect('/');
    var success, error = undefined;
    if('slug' in req.body) {
        if(req.body.slug && new RegExp(/[A-Za-z0-9-_]{3,32}/).test(req.body.slug)) {
            req.user.slug = req.body.slug;
            req.user.save(function(errors) {
                if(!errors) success = 'Your shiny new URL was created! <a href="/@' + req.body.slug + '">Check it out</a>';
                else error = errors;
                return res.render('pages/profileSetup', {req: req, config: config, tab: null,
                    setupSteps: shared.User.setupSteps,
                    success: success, error: error
                });
            });
        }
        else {
            return res.render('pages/profileSetup', {req: req, config: config, tab: null,
                setupSteps: shared.User.setupSteps,
                success: success, error: 'Custom URL must be 3-32 letters, numbers, underscores, and hyphens only.'
            });
        }
    }
    else {
        return res.redirect('/profile');
    }
});

router.get('/@:slug', function(req, res, next) {
    var error, profile, joined = undefined;
    config.mysql.pool.query('SELECT * FROM users WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(results.length) {
            profile = new shared.User(results[0]);
            joined = prettydate.format(new Date(Date.parse(profile.joined)));
            res.render('pages/profile', {req: req, config: config, tab: null,
                profile: profile,
                joined: joined,
                error: error
            });
        }
        else {
            config.mysql.pool.query('SELECT * FROM guilds WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
                if(errors || !results.length) {
                    error = 'User or community not found.';
                }
                else {
                    profile = new shared.Guild(results[0]);
                }
                res.render('pages/community', {req: req, config: config, tab: null,
                    profile: profile,
                    error: error
                });
            });
        }
    });
});