var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

import Session from './session';

server.listen(3000);

let serverData = {
  sessions: [],
  io: io
};

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  serverData.sessions.push(new Session(socket, serverData));
});
