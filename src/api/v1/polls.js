const {Guild} = require('../../shared');

server.api.get('/v1/polls', function(req, res) {
    if(!req.query.guild) {
        res.status(400);
        return res.send({error: 'Missing query: guild'});
    }
    check(req.query.guild, function(guild) {
        if(!req.query.type) {
            res.status(400);
            return res.send({error: 'Missing query: type'});
        }
        if(!['poll', 'ama'].includes(req.query.type.toLowerCase())) {
            res.status(400);
            return res.send({error: 'Invalid query: type'});
        }
        let type = req.query.type.toLowerCase();
        server.pool.query('SELECT * FROM polls WHERE guild = ? AND type = ? AND ends > CURRENT_TIMESTAMP', [guild.discordId, type], function(error, results) {
            poll(results[0], null, (data) => {
                res.send(data);
            }, (error, status=404) => {
                res.status(status);
                res.send({error: error});
            });
        });
    }, function(error, status=404) {
        res.status(status);
        res.send({error: error});
    });
});

server.api.get('/v1/polls/:id', function(req, res) {
    server.pool.query('SELECT * FROM polls WHERE id = ?', [req.params.id], function(error, results) {
        if(!results.length) {
            res.status(404);
            return res.send({error: 'Invalid parameter: id'});
        }
        poll(results[0], null, (data) => {
            res.send(data);
        }, (error, status=404) => {
            res.status(status);
            res.send({error: error});
        });
    });
});

server.api.patch('/v1/polls/:id', function(req, res) {
    if(!req.oauth) {
        res.status(401);
        res.send({error: 'Missing parameter: access_token'});
    }
    let voter = req.oauth ? req.oauth.user.discordId : null;
    if(voter == '0' && req.body.user) {
        voter = req.body.user;
    }
    let vote = 1; // TODO downvote for AMAs
    poll(null, req.params.id, (poll) => {
        if(req.body.ends) {
            // TODO start/end
        }
        if(req.body.choice > poll.choices.length) {
            res.status(400);
            return res.send({error: 'Invalid parameter: choice'});
        }
        server.pool.query('SELECT * FROM votes WHERE poll = ? AND user = ?', [poll.id, voter], function(error, results) {
            // Check for vote in poll - AMA will fail automatically if they vote twice on the same choice.
            // Being able to choose multiple AMA choices is good IMO.
            if(poll.type == 'poll' && results.length) {
                res.status(400);
                return res.send({error: 'You\'ve already voted in this poll'});
            }
            if(poll.type == 'ama') {
                if(!req.body.vote) {
                    res.status(400);
                    return res.send({error: 'Missing parameter: vote'});
                }
                else if(!['up', 'down'].includes(req.body.vote)) {
                    res.status(400);
                    return res.send({error: 'Invalid parameter: vote'});
                }
                vote = res.body.vote == 'up' ? 1 : -1;
            }
            server.pool.query('INSERT INTO votes (poll, user, choice, vote) VALUES (?, ?, ?, ?)', [poll.id, voter, req.body.choice, vote], function(error, results) {
                if(error) {
                    if(error.errno == 1062) {
                        res.status(400);
                        return res.send({error: 'You\'ve already voted in this poll'});
                    }
                    res.status(500); // TODO 400 for double vote 
                    return res.send({error: error});
                }
                res.status(204);
                res.send({});
            });
        });
    }, (error, status=404) => {
        res.status(status);
        res.send({error: error});
    });
});

function poll(data, id=null, done, fail) {
    if(data) {
        server.pool.query('SELECT * FROM choices WHERE poll = ? ORDER BY id', [data.id], function(error, results) {
            if(error) return fail(error, 500);
            data.choices = results;
            for(let choice = 0; choice < data.choices.length; choice++) data.choices[choice].votes = 0;
            server.pool.query('SELECT choice, COUNT(CHOICE) AS votes FROM votes WHERE poll = 1 GROUP BY choice ORDER BY choice', [data.id], function(error, results) {
                if(error) return fail(error, 500);
                for(let i = 0; i < results.length; i++) {
                    console.log('Choice', i);
                    console.log('JSON', data.choices[results[i].choice - 1]);
                    if(data.choices[results[i].choice - 1]) data.choices[results[i].choice - 1].votes = results[i].votes;
                }
                done(data);
            });
        });
    }
    else {
        server.pool.query('SELECT * FROM polls WHERE id = ?', [id], function(error, results) {
            if(error) return fail(error, 500);
            if(!results.length) return fail('Poll not found');
            return poll(results[0], null, done, fail);
        })
    }
}

function check(guild, done, fail) {
    server.pool.query('SELECT * FROM guilds WHERE discordId = ?', [guild], function(error, results) {
        if(error) return fail(error, 500);
        if(!results.length) return fail('Guild not found');
        done(results[0]);
    });
}