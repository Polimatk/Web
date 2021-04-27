const [app, config] = require('../server.js');
const router = require('./index.js');
const shared = require('../shared/guild.js');

router.get('/auth/discord',
    app._passport.authenticate('discord', { permissions: 8 })
);
router.get('/auth/discord/continue',
    app._passport.authenticate('discord', { successRedirect: '/', failureRedirect: '/auth/fail' })
);
router.get('/auth/twitch',
    app._passport.authenticate('twitch', { forceVerify: true })
);
router.get('/auth/twitch/continue',
    function(req, res, next) {
        if(!req.user) return res.redirect('/');
        if(!req.guild) return res.send('No guild selected');
        app._passport.authenticate('twitch', function(error, user, info) {
            if(error) return res.send(error);
            req.guild.twitchProfile = user;
            req.guild.save(function() {
                res.redirect('/');
            });
        })(req, res, next);
    }
);
router.get('/auth/youtube',
    app._passport.authenticate('youtube')
);
router.get('/auth/youtube/continue',
    function(req, res, next) {
        if(!req.user) return res.redirect('/');
        if(!req.guild) return res.send('No guild selected');
        app._passport.authenticate('youtube', function(error, user, info) {
            if(error) return res.send(error);
            req.guild.youtubeProfile = user;
            req.guild.save(function() {
                res.redirect('/');
            });
        })(req, res, next);
    }
);
router.get('/auth/fail', function(req, res) {
    res.render('pages/authFail', {req: req, config: config, tab: null,
        error: 'Failed to sign in with Discord. Please let us know if the problem persists.'
    });
});
router.get('/signout', function(req, res) {
    req.logout();
    res.redirect('/');
});
