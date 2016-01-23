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
  .controller('AppController', AppController)
  .directive('postIt', postIt)
  .directive('movable', movable);

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

  function create () {
    PostIt.create();
  }
}

AppController.prototype.login = function () {
  socket.emit('hello', { email: this.email });
  this.user = { email: this.email };
  this.user = this.email;
}



function postIt() {
  return {
    restrict: 'E',
    templateUrl: './post-it.html',
    scope: {
      data: '='
    },
    template: [
      '<div class="post-it" movable>',
        '<i class="fa fa-pencil-square-o" ng-click="edit()"  ng-show="!isEditing"></i>',
        '<i class="fa fa-floppy-o" ng-show="isEditing" ng-click="isEditing = !isEditing;"></i>',
        '<h2 ng-bind="title"></h2>',
        '<p ng-bind="description" ng-show="!isEditing"></p>',
        '<textarea ng-model="description" ng-show="isEditing"></textarea>',
      '</div>'
    ].join(''),
    controller: function PostItController($scope, $element, $attrs) {
      $scope.title = 'Totoa';
      $scope.description = 'The current description';
      console.log('Post It controller instanciated', $element);
      $scope.edit = function() {
        $scope.isEditing = !$scope.isEditing;
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
