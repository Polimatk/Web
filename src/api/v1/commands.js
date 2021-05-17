server.api.get('/v1/commands', function(req, res) {
    if(!req.query.guild) {
        res.status(400);
        return res.send({
            'error': 'Missing query: guild'
        });
    }
    check(req, req.query.guild, function() {
        server.pool.query('SELECT * FROM commands WHERE guild = ?', [req.query.guild], function(error, results) {
            res.send(results);
        });
    }, function(error, status=404) {
        res.status(status);
        res.send(error);
    });
});
server.api.get('/v1/commands/:name', function(req, res) {
    if(!req.query.guild) {
        res.status(400);
        return res.send({
            'error': 'Missing query: guild'
        });
    }
    check(req, req.query.guild, function() {
        server.pool.query('SELECT * FROM commands WHERE guild = ? AND name = ?', [req.query.guild, req.params.name], function(error, results) {
            if(!results.length) {
                res.status(404);
                return res.send({
                    'error': 'Command could not be found'
                });
            } 
            res.send(results[0]);
        });
    }, function(error, status=404) {
        res.status(status);
        res.send(error);
    });
});
server.api.put('/v1/commands/:name', function(req, res) {
    if(!req.params.name) {
        res.status(400);
        return res.send({
            'error': 'Missing parameter: name'
        });
    }
    if(!req.body.guild) {
        res.status(400);
        return res.send({
            'error': 'Missing parameter: guild'
        });
    }
    if(!req.body.response || !req.body.response.length) {
        res.status(400);
        return res.send({
            'error': 'Missing parameter: response'
        });
    }
    if(!req.body.permissions || !(['all', 'subs', 'mods', 'none'].includes(req.body.permissions))) {
        res.status(400);
        return res.send({
            'error': 'Missing or invalid parameter: permissions'
        });
    }
    check(req, req.body.guild, function() {
        server.pool.query('INSERT INTO commands (guild, name, response, permissions) VALUES (?, ?, ?, ?) ' +
            'ON DUPLICATE KEY UPDATE name = ?, response = ?, permissions = ?',
            [req.body.guild, req.params.name, req.body.response, req.body.permissions,
            req.params.name, req.body.response, req.body.permissions], function(error, results) {
            if(error) {
                return res.send({
                    'error': error
                });
            }
            res.status(204);
            res.send({});
        });
    }, function(error, status=404) {
        res.status(status);
        res.send(error);
    });
});
server.api.delete('/v1/commands/:name', function(req, res) {
    if(!req.query.guild) {
        res.status(400);
        return res.send({
            'error': 'Missing query: guild'
        });
    }
    if(!req.params.name) {
        res.status(400);
        return res.send({
            'error': 'Missing parameter: name'
        });
    }
    check(req, req.query.guild, function() {
        server.pool.query('DELETE FROM commands WHERE guild = ? AND name = ?', [req.query.guild, req.params.name], function(error, results) {
            if(!results.affectedRows) {
                res.status(404);
                return res.send({
                    'error': 'Command could not be found'
                });
            }
            res.status(204);
            res.send({});
        });
    }, function(error, status=404) {
        res.status(status);
        res.send(error);
    })
});

function check(req, guild, done, fail) {
    if(!req.oauth) {
        return fail({
            error: 'Missing access token'
        }, 401);
    }
    var found = false;
    var guilds = req.oauth.user.discordProfile.guilds;
    for(var i = 0; i < guilds.length; i++) {
        if(guilds[i].id == guild && (guilds[i].permissions & 0x20) == 0x20) {
            found = true;
            done();
        }
    }
    if(!found) {
        fail({
            error: 'Could not find guild'
        });
    }
}