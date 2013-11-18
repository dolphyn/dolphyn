
function AppCtrl($scope, socket, $routeParams, $location, menuService) {
  socket.on('unauth:user', function() {
    if($location.path() !== '/login') {
      $location.path('/login')
    }
  })
}