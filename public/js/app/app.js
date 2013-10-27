'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['ngSanitize', 'ngRoute', 'myApp.filters', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/box/:boxId', {templateUrl: 'partials/box.html',   controller: BoxCtrl}).
      when('/box/:boxId/:messageId', {templateUrl: 'partials/box.html',   controller: BoxCtrl}).
      when('/settings', {templateUrl: 'partials/settings.html', controller: SettingsCtrl}).
      when('/compose', {templateUrl: 'partials/compose.html', controller: ComposeCtrl}).
      otherwise({redirectTo: '/box/Inbox'});
  }]);