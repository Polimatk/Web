const {User} = require('../shared');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
server.api = require('express').Router();

const versions = {
    'v1': {
        uri: 'https://api.polima.tk/v1/',
        description: 'Initial release of the Polimatk API.',
        documentation: 'https://polimatk.github.io/API/v1/'
    },
    'overlays': {
        uri: 'https://api.polima.tk/overlays/',
        description: 'Stream overlays for Polimatk.',
        documentation: 'https://polimatk.github.io/API/Overlays/'
    },
    'oauth2': {
        uri: 'https://api.polima.tk/oauth2/',
        description: 'API authentication',
        documentation: 'https://polimatk.github.io/API/OAuth2/'
    }
};

server.api.use(cors());

server.api.use(function(req, res, next) {
    let token = null;
    req.oauth = null;
    if(req.query.access_token) {
        token = req.query.access_token;
    }
    else if(req.headers.authorization) {
        if(req.headers.authorization.substr(0, 7) == 'Bearer ') {
            token = req.headers.authorization.substr(7);
        }
    }
    res.set('Content-Type', 'application/json; charset=utf-8');
    if(!token) return next();
    if(token == 'readonly') {
        req.oauth = {id: 'readonly', user: null, scope: '*'};
        return next();
    }
    server.pool.query('SELECT * FROM tokens WHERE id = ?', [token], function(error, results) {
        if(!results.length) {
            res.status(403);
            return res.send({
                'error': 'Invalid access token'
            });
        }
        User.findOrCreate(results[0].user, function(error, user) {
            results[0].user = user;
            results[0].scope = results[0].scope ? results[0].scope.split(' ') : null;
            req.oauth = results[0];
            next();
        });
    });
});

server.api.get('/', function(req, res) {
    res.send({
        versions: versions,
        authentication: req.oauth || null
    });
});

for(version in versions) {
    fs.readdirSync(path.join(__dirname, version)).forEach((route) => {
        require(path.join(__dirname, version, route));
    });
}

server.api.use(function(req, res) {
    res.status(404);
    res.send({
        'error': 'API endpoint does not exist'
    });
})
