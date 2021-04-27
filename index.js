const {Server} = require('./src/server.js');
global.server = new Server();
server.start();
