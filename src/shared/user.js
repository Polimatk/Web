const md5 = require('md5');

module.exports = class User {
    static setupSteps = 2;
    constructor(data, token=null) {
        this.discordId = data.discordId;
        this.discordProfile = JSON.parse(Buffer.from(data.discordProfile, 'base64').toString('utf8'));
        this.slug = data.slug;
        this.joined = data.joined;
        this.setup = data.setup;
        this.remainingSteps = User.setupSteps;
        this.token = token;
        this.currentStep = 'choose a username';
        if(this.slug) {
            this.remainingSteps--;
            this.currentStep = 'set up your community';
        }
        if(this.setup) {
            this.remainingSteps--;
            this.currentStep = null;
        }
    }
    save(done) {
        if(this.slug && this.currentStep == 'choose a username') {
            this.remainingSteps--;
            this.currentStep = 'set up your community';
        }
        if(this.setup && this.currentStep == 'set up your community') {
            this.remainingSteps--;
            this.currentStep = null;
        }
        server.pool.query(
            'UPDATE users SET slug = ?, discordProfile = ?, setup = ? WHERE discordId = ?',
            [
                this.slug,
                Buffer.from(JSON.stringify(this.discordProfile), 'utf8').toString('base64'),
                this.setup,
                this.discordId
            ],
            function(errors, results, fields) {
                done(errors, results);
            }
        );
    }
    static findOrCreate(profileOrId, done) {
        var id = profileOrId, profile = null;
        if(isNaN(id)) {
            id = profileOrId.id;
            profile = Buffer.from(JSON.stringify(profileOrId), 'utf8').toString('base64');
        }
        server.pool.query('SELECT * FROM users WHERE discordId = ?', [id], function(error, results) {
            if(results.length) {
                let user = new User(results[0]);
                if(profile) {
                    user.discordProfile = profileOrId;
                    user.save(function(error, no) {
                        getToken(user, done);
                    });
                }
                else {
                    getToken(user, done);
                }
            }
            else {
                if(!profile) throw new Error('Missing Discord profile data. Can\'t create user');
                server.pool.query('INSERT INTO users (discordId, discordProfile) VALUES (?, ?)', [id, profile], function(error, results) {
                    if(error) throw error;
                    return User.findOrCreate(profileOrId, done);
                });
            }
        });
    }
}

function getToken(user, done) {
    server.pool.query('SELECT * FROM tokens WHERE user = ? AND app = ?', [user.discordId, 'polimatk'], function(error, tokens) {
        if(tokens.length) {
            user.token = tokens[0].id;
            return done(error, user);
        }
        let token = md5(Math.random());
        server.pool.query('INSERT INTO tokens (id, user, app) VALUES (?, ?, ?)', [token, user.discordId, 'polimatk'], function(error, added) {
            user.token = token;
            done(null, user);
        });
    });
}