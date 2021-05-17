server.web.get('/commands', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    server.pool.query('SELECT * FROM commands WHERE guild = ?', [req.guild.discordId], function(error, results, fields) {
        let commands = [];
        for(let i = 0; i < results.length; i++) {
            commands.push(results[i]);
        }
        return res.render('pages/commands', {req: req, server: server, tab: 'commands',
            commands: commands});
    });
});
server.web.post('/commands', function(req, res) {
    if(!req.isAuthenticated() || !req.guild) return res.redirect('/');
    res.redirect('/commands');
});