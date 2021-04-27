const [app, config] = require('../server.js');

module.exports = class User {
    static setupSteps = 2;
    constructor(data) {
        this.discordId = data.discordId;
        this.discordProfile = JSON.parse(Buffer.from(data.discordProfile, 'base64').toString('utf8'));
        this.slug = data.slug;
        this.joined = data.joined;
        this.setup = data.setup;
        this.remainingSteps = User.setupSteps;
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
        config.mysql.pool.query(
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
        config.mysql.pool.query('SELECT * FROM users WHERE discordId = ?', [id], function(error, results, fields) {
            if(error) throw error;
            if(results.length) return done(null, new User(results[0]));
            if(!profile) throw new Error('Missing Discord profile data. Can\'t create user');
            config.mysql.pool.query('INSERT INTO users (discordId, discordProfile) VALUES (?, ?)', [id, profile], function(error, results, fields) {
                if(error) throw error;
                return User.findOrCreate(profileOrId, done);
            });
        });
    }
}