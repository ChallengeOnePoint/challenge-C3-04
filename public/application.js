'use strict';

var socket = io.connect('http://localhost:3000');

socket.on('connect', function () {
  socket.emit('hello', { email: 'jean.dupouy@rednet.io' });
});

angular
  .module('app', [])
  .run(setupSocketIo)
  .factory('PostIt', postItFactory)
  .factory('User', userFactory)
  .controller('AppController', AppController);

function setupSocketIo (PostIt, User) {
  socket.on('take', PostIt.take);
  socket.on('release', PostIt.release);
  socket.on('update', PostIt.update);
  socket.on('load', load);
  socket.on('login', User.login);
  socket.on('logout', User.logout);

  function load (data) {
    PostIt.postIts.length = 0;
    PostIt.postIts.push.apply(PostIt.postIts, data.postIts);

    User.users.length = 0;
    User.users.push.apply(User.users, data.users);
  }
}

function postItFactory () {
  var postIts = [];

  return {
    postIts: postIts,
    create: create,
    take: take,
    release: release,
    update: update
  };

  function create () {
    socket.emit('create');
  }

  function take (postIt, isLocal) {
    postIts[postIt.id].taken = true;

    if (isLocal) {
      socket.emit('take', postIt);
    }
  }

  function release (postIt, isLocal) {
    delete postIts[postIt.id].taken;

    if (isLocal) {
      socket.emit('release', postIt);
    }
  }

  function update (postIt, isLocal) {
    postIts[postIt.id] = postIt;

    if (isLocal) {
      socket.emit('update', postIt);
    }
  }
}

function userFactory () {
  var users = {};

  return {
    users: users,
    login: login,
    logout: logout
  };

  function login (user) {
    users[user.email] = user;
  }

  function logout (user) {
    delete users[user.email];
  }
}

function AppController (PostIt, User) {
  this.postIts = PostIt.postIts;
  this.users   = User.users;
}
