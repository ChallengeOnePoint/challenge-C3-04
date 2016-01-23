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
  socket.on('take', takePostIt);
  socket.on('release', releasePostIt);
  socket.on('update', updatePostIt);
  socket.on('load', load);
  socket.on('login', User.login);
  socket.on('logout', User.logout);

  function takePostIt (postIt) {
    PostIt.take(postIt, true);
  }

  function releasePostIt (postIt) {
    PostIt.release(postIt, true);
  }

  function updatePostIt (postIt) {
    PostIt.update(postIt, true);
  }

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

  function take (postIt, isRemote) {
    postIts[postIt.id].taken = true;

    if (!isRemote) {
      socket.emit('take', postIt);
    }
  }

  function release (postIt, isRemote) {
    delete postIts[postIt.id].taken;

    if (!isRemote) {
      socket.emit('release', postIt);
    }
  }

  function update (postIt, isRemote) {
    postIts[postIt.id] = postIt;

    if (!isRemote) {
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

AppController.prototype.login = function () {
  socket.emit('hello', { email: this.email });
  this.user = { email: this.email };
}
