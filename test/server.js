const {Server} = require('../src/server.js');
const axios = require('axios');
const server = new Server();

test('Start web server', done => {
    server.start();
    server.on('listening', () => {
        test = axios.get('http://localhost:3000').catch(function(error) {
            if(error.response) expect(error.response.status).toBe(400);
            server.http.close();
            setTimeout(done);
        });
    });
});