const {Guild} = require('../../shared');

server.api.get('/v1/guilds', function(req, res) {
    res.status(400);
    res.send({
        'error': 'Missing parameter: guild'
    });
});
server.api.get('/v1/guilds/:id', function(req, res) {
    check(req, req.params.id, function(guild) {
        res.send(guild);
    }, function(data, status=404) {
        res.status(status);
        res.send(data);
    });
});
server.api.patch('/v1/guilds/:id', function(req, res) {
    check(req, req.params.id, function(guild) {
        // TODO patch
        guild.save(function(errors, results) {
            if(errors) {
                res.status(500);
                return res.send(errors);
            }
            res.send(guild);
        });
    }, function(data, status=404) {
        res.status(status);
        res.send(data);
    });
});

function check(req, guild, done, fail) {
    if(!req.oauth) {
        return fail({
            error: 'Missing access token'
        }, 401);
    }
    let found = false;
    let guilds = req.oauth.user.discordProfile.guilds;
    for(let i = 0; i < guilds.length; i++) {
        if(guilds[i].id == guild && (guilds[i].permissions & 0x20) == 0x20) {
            found = true;
            Guild.findOrCreate(guilds[i], function(error, guild) {
                if(error) return fail(error);
                done(guild);
            });
        }
    }
    if(!found) {
        fail({
            error: 'Could not find guild'
        });
    }
}