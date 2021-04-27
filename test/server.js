const [app, config] = require('../src/server.js');
const axios = require('axios');

test('Start web server', done => {
    app.on('listening', () => {
        test = axios.get('http://localhost:3000').catch(function(error) {
            if(error.response) expect(error.response.status).toBe(400);
            app._listen.close();
            config.mysql.pool.end();
            setTimeout(done);
        });
    });
});