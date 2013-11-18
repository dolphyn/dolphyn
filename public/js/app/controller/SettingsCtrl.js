

function SettingsCtrl($scope, socket, $sce, $log) {
  $log.info('SettingsCtrl')

  $scope.saving = false

  socket.emit('get:settings', undefined)

  socket.on('get:settings', function (settings) {
    $scope.settings = settings
  })

  socket.on('error:settings', function (err) {
    $log.error(err)
    $scope.saving = false
  })

  socket.on('ok:settings', function () {
    $scope.saving = false
  })


  $scope.save = function() {
    $scope.saving = true
    socket.emit("save:settings", $scope.settings)
    return false
  }

  $scope.$on('$destroy', function (event) {
    socket.removeAllListeners();
    // or something like
    // socket.removeListener(this);
  });
}