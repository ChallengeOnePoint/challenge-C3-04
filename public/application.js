'use strict';

angular
  .module('app', [])
  .controller('AppController', AppController);

function AppController () {
  this.postIts = [];
}