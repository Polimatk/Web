const EventEmitter = require('events');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const MySQL = require('mysql');
const MySQLSession = require('connect-mysql')(session);
const Discord = require('passport-discord').Strategy;
const Twitch = require('passport-twitch-strategy').Strategy;
const YouTube = require('passport-youtube-v3').Strategy;
const path = require('path');

const {User} = require('./shared');

class Server extends EventEmitter {
    constructor(jest=process.env.JEST_WORKER_ID !== undefined) {
        super();
        if(global.server) return console.warn('Tried to construct server twice!');
        this.started = false;
        this.jest = jest;
        this.app = express();
        this.passport = passport;
        if(this.jest) {
            this.config = require('./example-config.json');
        }
        else {
            this.config = require('./config.json');
            console.log('Creating pool');
            this.pool = MySQL.createPool(this.config.mysql.config);
            this.config.mysql.pool = this.pool;
            this.config.session.store = new MySQLSession(this.config.mysql);
        }
    }
    start() {
        if(this.started) return console.warn('Tried to start server twice!');
        this.started = true;
        if(!this.jest) {
            this.passport.use(new Discord(this.config.passport.discord,
                function(access, refresh, profile, done) {
                    profile.accessToken = access;
                    profile.refreshToken = refresh;
                    console.log(this.pool);
                    User.findOrCreate(profile, function(errors, user) {
                        return done(errors, user);
                    });
                }
            ));
            this.passport.use(new Twitch(this.config.passport.twitch,
                function(access, refresh, profile, done) {
                    profile.accessToken = access;
                    profile.refreshToken = refresh;
                    return done(null, profile);
                }
            ));
            this.passport.use(new YouTube(this.config.passport.youtube,
                function(access, refresh, profile, done) {
                    profile.accessToken = access;
                    profile.refreshToken = refresh;
                    return done(null, profile);
                }
            ));
            this.app.use(session(this.config.session));
            this.app.use(this.passport.initialize());
            this.app.use(this.passport.session());
            this.app.use(express.urlencoded({extended: true}));
            this.app.use(express.json());
        
            this.passport.serializeUser(function(user, done) {
                return done(null, user.discordId);
            });
            this.passport.deserializeUser(function(userId, done) {
                User.findOrCreate(userId, function(errors, user) {
                    return done(errors, user);
                });
            });
            this.app.set('view engine', 'ejs');
            require('./web');
            require('./api');
        }
        
        this.app.use(function(req, res, next) {
            res.set('Access-Control-Allow-Origin', '*');
            if(global.server) {
                switch(req.headers.host) {
                    case 'polima.tk':
                    case 'www.polima.tk':
                        return server.web(req, res, next);
                    case 'api.polima.tk':
                        res.set('Content-Type', 'application/json; charset=utf-8');
                        return server.api(req, res, next);
                }
            }
            res.status(400);
            res.sendFile(path.join(__dirname, '../static/400.html'));
        });
        
        this.app.use(express.static('./static'));
        
        this.app.use(function(req, res, next) {
            res.status(404);
            res.sendFile(path.join(__dirname, '../static/404.html'));
        });
        let me = this;
        this.http = this.app.listen(3000, function(error) {
            if(error) return console.log(error);
            console.log('Server started on :3000');
            me.emit('listening');
        });
    }
}

module.exports = {Server};