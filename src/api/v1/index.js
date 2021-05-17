server.api.get('/v1', function(req, res) {
    res.send({
        documentation: 'https://polimatk.github.io/API/v1/'
    });
});