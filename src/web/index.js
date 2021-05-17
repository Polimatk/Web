const {User, Guild} = require('../shared');
const fs = require('fs');
server.web = require('express').Router();

server.web.use(function(req, res, next) {
    if(req.session) {
        if(!req.session.theme) req.session.theme = 'auto';
        if(req.body.theme && ['auto', 'light', 'dark'].includes(req.body.theme)) {
            req.session.theme = req.body.theme;
            return res.redirect(req.path);
        }
    }
    if(req.user && req.session.guild) {
        for(var i = 0; i < req.user.discordProfile.guilds.length; i++) {
            if(req.user.discordProfile.guilds[i].id == req.session.guild) {
                Guild.findOrCreate(req.user.discordProfile.guilds[i], function(errors, guild) {
                    req.guild = guild;
                    next();
                });
            }
        }
    }
    else {
        next();
    }
});

server.web.get('/', function(req, res) {
    return res.render('pages/index', {req: req, server: server, tab: 'dashboard',
        setupSteps: User.setupSteps,
        success: !req.user || req.guild ? undefined : 'Please select a server to manage in the menu.'});
});
server.web.post('/', function(req, res) {
    if(!req.user || !req.guild) return res.redirect('/');
    var success, error = undefined;
    if(req.body.slug && new RegExp(/[A-Za-z0-9-_]{3,32}/).test(req.body.slug)) {
        req.guild.slug = req.body.slug;
        req.guild.save(function(errors) {
            if(errors) {
                return res.render('pages/index', {req: req, server: server, tab: null,
                    setupSteps: User.setupSteps,
                    success: success,
                    error: errors
                });
            }
            else {
                req.user.setup = req.guild.discordId;
                req.user.save(function(errors) {
                    console.log('SAVE', errors, req.user);
                    return res.render('pages/index', {req: req, server: server, tab: null,
                        setupSteps: User.setupSteps,
                        success: 'Your shiny new URL was created! <a href="/@' + req.body.slug + '">Check it out</a>',
                        error: error
                    });
                });
            }
        });
    }
    else {
        return res.render('pages/index', {req: req, server: server, tab: 'dashboard',
            setupSteps: User.setupSteps,
            success: success,
            error: req.body.slug ? 'Custom URL must be 3-32 letters, numbers, underscores, and hyphens only.' : undefined
        });
    }
});

server.web.get('/server/:server', function(req, res) {
    for(var i = 0; i < req.user.discordProfile.guilds.length; i++) {
        var guild = req.user.discordProfile.guilds[i];
        if(guild.id == req.params.server) {
            req.session.guild = guild.id;
            return res.redirect('/');
        }
    }
    return res.redirect('/auth/fail');
});


fs.readdirSync(__dirname).forEach((page) => {
    if(page == 'index.js') return;
    require('./' + page);
});