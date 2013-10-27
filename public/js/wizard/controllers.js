'use strict';

/* Controllers */

wizard.controller('SettingsCtrl', function($scope, socket) {

  socket.emit('get:settings', undefined);

  socket.on('get:settings', function (settings) {
//    console.log(settings)
    $scope.settings = settings;
  });

  socket.on('error:settings', function (err) {
    console.log(err);
  });

  socket.on('ok:settings', function () {
    window.location.replace('/');
  });


  $scope.save = function() {
    console.log($scope.settings)
    socket.emit("save:settings", $scope.settings);
    return false;
  };


});