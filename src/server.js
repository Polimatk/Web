const express = require('express');
const parser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const config = require('./config.json');

const mysql = require('mysql');
const MySQL = require('connect-mysql')(session);
const Discord = require('passport-discord').Strategy;
const Twitch = require('passport-twitch-strategy').Strategy;
const YouTube = require('passport-youtube-v3').Strategy;
const path = require('path');

const app = express();

module.exports = [app, config];

config.mysql.pool = mysql.createPool(config.mysql.config);
config.session.store = new MySQL(config.mysql);

passport.use(new Discord(config.passport.discord,
    function(access, refresh, profile, done) {
        profile.accessToken = access;
        profile.refreshToken = refresh;
        shared.User.findOrCreate(profile, function(errors, user) {
            return done(errors, user);
        });
    }
));
passport.use(new Twitch(config.passport.twitch,
    function(access, refresh, profile, done) {
        profile.accessToken = access;
        profile.refreshToken = refresh;
        return done(null, profile);
    }
));
passport.use(new YouTube(config.passport.youtube,
    function(access, refresh, profile, done) {
        profile.accessToken = access;
        profile.refreshToken = refresh;
        return done(null, profile);
    }
));
app.use(session(config.session));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({extended: true}));
app.use(express.json());

passport.serializeUser(function(user, done) {
    return done(null, user.discordId);
});
passport.deserializeUser(function(userId, done) {
    shared.User.findOrCreate(userId, function(errors, user) {
        return done(errors, user);
    });
});
app._passport = passport;

app.set('view engine', 'ejs');
const web = require('./web');
const api = require('./api');
const shared = require('./shared');

app.use(function(req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    switch(req.headers.host) {
        case 'polima.tk':
        case 'www.polima.tk':
            return web(req, res, next);
        case 'api.polima.tk':
            res.set('Content-Type', 'application/json; charset=utf-8');
            return api(req, res, next);
    }
    res.status(400);
    res.sendFile(path.join(__dirname, '../static/400.html'));
});

app.use(express.static('./static'));

app.use(function(req, res, next) {
    res.status(404);
    res.sendFile(path.join(__dirname, '../static/404.html'));
});

app._listen = app.listen(3000, function(error) {
    if(error) return console.log(error);
    console.log('Server started on :3000');
    app.emit('listening');
});