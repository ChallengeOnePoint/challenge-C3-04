'use strict';

var socket = io.connect('http://' + window.location.hostname + ':3000');

angular
  .module('app', [])
  .run(setupSocketIo)
  .factory('PostIt', postItFactory)
  .factory('User', userFactory)
  .controller('AppController', AppController)
  .directive('postIt', postIt)
  .directive('movable', movable);

function setupSocketIo ($rootScope, PostIt, User) {
  socket.on('take', takePostIt);
  socket.on('release', releasePostIt);
  socket.on('update', updatePostIt);
  socket.on('remove', removePostIt);
  socket.on('load', load);
  socket.on('login', User.login);
  socket.on('logout', User.logout);

  function takePostIt (postIt) {
    $rootScope.$evalAsync(function () {
      PostIt.take(postIt, true);
    });
  }

  function releasePostIt (postIt) {
    $rootScope.$evalAsync(function () {
      PostIt.release(postIt, true);
    });
  }

  function updatePostIt (postIt) {
    $rootScope.$evalAsync(function () {
      PostIt.update(postIt, true);
    });
  }

  function removePostIt (postIt) {
    $rootScope.$evalAsync(function () {
      PostIt.remove(postIt, true);
    });
  }

  function load (data) {
    angular.forEach(data.postIts, function (postIt) {
      PostIt.postIts[postIt.id] = postIt;
    });

    angular.forEach(data.users, function (user) {
      User.users[user.email] = user;
    });
  }
}

function postItFactory () {
  var postIts = [];

  return {
    postIts: postIts,
    create: create,
    take: take,
    release: release,
    update: update,
    remove: remove
  };

  function create () {
    socket.emit('create');
  }

  function take (postIt, isRemote) {
    update(postIt);

    if (!isRemote) {
      socket.emit('take', postIt);
    }
  }

  function release (postIt, isRemote) {
    update(postIt);

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

  function remove (postIt, isRemote) {
    delete postIts[postIt.id];

    if (!isRemote) {
      socket.emit('remove', postIt);
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
  var self = this;

  this.postIts = PostIt.postIts;
  this.users   = User.users;
  this.PostIt  = PostIt;

  this.update  = function (postIt) {
    console.log('a', postIt);
    self.PostIt.update(postIt);
  };
}

AppController.prototype.login = function () {
  socket.emit('hello', { email: this.email });
  this.user = { email: this.email };
  this.user = this.email;
};

AppController.prototype.create = function () {
  this.PostIt.create();
};

AppController.prototype.take = function (postIt) {
  this.PostIt.take(postIt);
};

AppController.prototype.release = function (postIt) {
  this.PostIt.release(postIt);
};

function postIt() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'post-it.html',
    scope: {
      data: '=',
      updateCb: '&'
    },
    controller: function PostItController($scope, $element, $attrs) {
      console.log($scope.data, $scope.updateCb);
      $scope.edit = function() {
        $scope.isEditing = !$scope.isEditing;
      };

      $scope.save = function() {
        $scope.updateCb()($scope.data);
      };
      $scope.isEditing = false;
    }
  };
}

function movable($document) {
  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var startX = 0, startY = 0, x = 0, y = 0;

      $element.css({
       position: 'relative'
      });

      $element.on('mousedown', function(event) {
        if (event.toElement.nodeName !== 'TEXTAREA') {
          event.preventDefault();
        }
        startX = event.pageX - x;
        startY = event.pageY - y;
        $document.on('mousemove', mousemove);
        $document.on('mouseup', mouseup);
      });

      function mousemove(event) {
        if (event.toElement.nodeName !== 'TEXTAREA') {
          y = event.pageY - startY;
          x = event.pageX - startX;
          $element.css({
            top: y + 'px',
            left:  x + 'px'
          });
        }
      }

      function mouseup() {
        $document.off('mousemove', mousemove);
        $document.off('mouseup', mouseup);
      }
    }
  };
}
