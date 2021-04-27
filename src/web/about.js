const [app, config] = require('../server.js');
const router = require('./index.js');

router.get(['/about', '/about/:section'], function(req, res) {
    return res.render('pages/about', {req: req, config: config, tab: 'about',
        section: req.params.section || null
    });
});