'use strict';


// Declare app level module which depends on filters, and services
var app = angular.module('myApp', ['ngSanitize', 'ngRoute', 'myApp.filters', 'myApp.directives']).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.
      when('/login',                {templateUrl: '/partials/login.html',   controller: LoginCtrl}).
      when('/app/:menu/:resource',  {templateUrl: '/partials/menu.html',   controller: MenuCtrl}).
      otherwise({redirectTo: '/login'});
  }]).
  config(function($locationProvider) {
    $locationProvider.html5Mode(true)
  });