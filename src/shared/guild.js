module.exports = class Guild {
    static setupSteps = 2;
    constructor(data) {
        this.discordId = data.discordId;
        this.discordProfile = JSON.parse(Buffer.from(data.discordProfile, 'base64').toString('utf8'));
        this.twitchProfile = data.twitchProfile ? JSON.parse(Buffer.from(data.twitchProfile, 'base64').toString('utf8')) : null;
        this.youtubeProfile = data.youtubeProfile ? JSON.parse(Buffer.from(data.youtubeProfile, 'base64').toString('utf8')) : null;
        this.slug = data.slug;
    }
    save(done) {
        server.pool.query(
            'UPDATE guilds SET slug = ?, discordProfile = ?, twitchProfile = ?, youtubeProfile = ? WHERE discordId = ?',
            [
                this.slug,
                Buffer.from(JSON.stringify(this.discordProfile), 'utf8').toString('base64'),
                this.twitchProfile ? Buffer.from(JSON.stringify(this.twitchProfile), 'utf8').toString('base64') : null,
                this.youtubeProfile ? Buffer.from(JSON.stringify(this.youtubeProfile), 'utf8').toString('base64') : null,
                this.discordId
            ],
            function(errors, results, fields) {
                if(errors) throw errors;
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
        server.pool.query('SELECT * FROM guilds WHERE discordId = ?', [id], function(error, results, fields) {
            if(error) throw error;
            if(results.length) return done(null, new Guild(results[0]));
            if(!profile) throw new Error('Missing Discord profile data. Can\'t create user');
            server.pool.query('INSERT INTO guilds (discordId, discordProfile) VALUES (?, ?)', [id, profile], function(error, results, fields) {
                if(error) throw error;
                return Guild.findOrCreate(profileOrId, done);
            });
        });
    }
}