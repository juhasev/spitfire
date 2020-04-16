const express = require('express');
const app = express();

const server = app.listen(3001, function() {
    console.log('Server running on port 3001');
});

app.get('/', function(request, response){
    response.json({
        route: '/',
        game: 'Spitfire'
    });
});

const io = require('socket.io')(server);

let games = [];

io.on('connection', function(socket) {
    console.log(socket.id)

    socket.on('SEND_MESSAGE', function(data) {
        io.emit('MESSAGE', data)
    });

    socket.on('CREATE_GAME', function(data) {

        games.forEach(game => {
            if (game.name === data.name) {
                io.emit('MESSAGE', {
                    message: 'Game with that name is already exists!'
                });
            }
        });

        io.emit('MESSAGE', {
            message: 'Game created!'
        });

        games.push(data);
    });
});