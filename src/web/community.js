const [app, config] = require('../server.js');
const router = require('./index.js');
const shared = require('../shared');

router.get('/@:slug', function(req, res) {
    var error, profile, joined = undefined;
    config.mysql.pool.query('SELECT * FROM guilds WHERE slug = ?', [req.params.slug], function(errors, results, fields) {
        if(errors || !results.length) {
            error = 'User or community not found.';
        }
        else {
            profile = new shared.Guild(results[0]);
        }
        res.render('pages/community', {req: req, config: config, tab: null,
            profile: profile,
            error: error
        });
    });
});