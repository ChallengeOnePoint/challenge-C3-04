var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

import Session from './session';

server.listen(3000);

let serverData = {
  sessions: [],
  postIts: [],
  io: io
};

app.use(express.static('public'));

app.get('/bite', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  serverData.sessions.push(new Session(socket, serverData));
});
