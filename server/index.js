import express from 'express';
import http from 'http';
import socketIo from 'socket.io';

const app = express();
const server = http.Server(app);
const io = socketIo(http);

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log('a user connected');
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});
