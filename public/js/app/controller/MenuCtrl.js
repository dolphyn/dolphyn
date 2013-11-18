function MenuCtrl($scope, $log, $routeParams, $location, menuService) {

  $scope.currentMenu = $routeParams.menu
  $scope.unreadCount = ''

  $scope.$on('handleBroadcast', function() {
    if(menuService.message) {
      if(!menuService.message.unreadCount) {
        $scope.unreadCount = ''
        document.title = 'Dolphyn Mail';
      } else {
        $scope.unreadCount = menuService.message.unreadCount
        document.title = '('+$scope.unreadCount+') Dolphyn Mail';
      }
    }
  })

  $scope.compose = function() {
    $location.path('/app/Drafts/new')
  }

  $scope.changeMenu = function(menu) {
    $scope.currentMenu = menu
  }

  $log.info('MenuPageCtrl:' + $routeParams.menu)

  if($routeParams.menu === 'Account') {
    $scope.template = '/partials/account.html'
  } else {
    $scope.template = '/partials/box.html'
  }

}