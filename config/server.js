const http = require('http');

const initializeServer = (app) => {
    const server = http.createServer(app);
    return server;
};

module.exports = {
    initializeServer
};