server.web.get('/auth/discord',
    server.passport.authenticate('discord', { permissions: 8 })
);
server.web.get('/auth/discord/continue', function(req, res) {
    server.passport.authenticate('discord', function(error, user) {
        if(error) return res.redirect('/auth/fail');
        return req.login(user, function(error) {
            if(error) return res.redirect(req.query.state ? 'https://api.polima.tk/oauth2/fail' : 'https://polima.tk/auth/fail');
            res.redirect(req.query.state ? Buffer.from(req.query.state, 'base64').toString('utf8') : '/');
        });
    })(req, res);
});
server.web.get('/auth/twitch',
    server.passport.authenticate('twitch', { forceVerify: true })
);
server.web.get('/auth/twitch/continue', function(req, res, next) {
        if(!req.user) return res.redirect('/');
        if(!req.guild) return res.send('No guild selected');
        server.passport.authenticate('twitch', function(error, user) {
            if(error) return res.send(error);
            req.guild.twitchProfile = user;
            req.guild.save(function() {
                res.redirect('/');
            });
        })(req, res, next);
    }
);
server.web.get('/auth/youtube',
    server.passport.authenticate('youtube')
);
server.web.get('/auth/youtube/continue', function(req, res, next) {
        if(!req.user) return res.redirect('/');
        if(!req.guild) return res.send('No guild selected');
        server.passport.authenticate('youtube', function(error, user) {
            if(error) return res.send(error);
            req.guild.youtubeProfile = user;
            req.guild.save(function() {
                res.redirect('/');
            });
        })(req, res, next);
    }
);
server.web.get('/auth/fail', function(req, res) {
    res.render('pages/authFail', {req: req, server: server, tab: null,
        error: 'Failed to sign in with Discord. Please let us know if the problem persists.'
    });
});
server.web.get('/signout', function(req, res) {
    req.logout();
    res.redirect(req.query.state ? Buffer.from(req.query.state, 'base64').toString('utf8') : '/');
});
