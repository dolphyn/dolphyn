'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['ngSanitize', 'ngRoute', 'myApp.filters', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/login',          {templateUrl: '/partials/login.html',   controller: LoginCtrl}).
      when('/box/:menuItem',  {templateUrl: '/partials/menu.html',   controller: MenuPageCtrl}).
      when('/compose',        {templateUrl: '/partials/compose.html', controller: ComposeCtrl}).
      otherwise({redirectTo: '/login'});
  }]).
  config(function($locationProvider) {
    $locationProvider.html5Mode(true)
  });