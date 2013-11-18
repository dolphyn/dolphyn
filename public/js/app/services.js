'use strict'

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
app.factory('socket', function ($rootScope, $log) {
  var socket = io.connect()
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {
        var args = arguments
        $log.info('< ' + eventName + ' ' + args)
        $rootScope.$apply(function () {
          callback.apply(socket, args)
        })
      })
    },
    removeAllListeners: function (eventName) {
      socket.removeAllListeners(eventName)
    },
    emit: function (eventName, data, callback) {
      $log.info('> ' + eventName + ' ' + data)
      socket.emit(eventName, data, function () {
        var args = arguments
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args)
          }
        })
      })
    }
  }
})

app.factory('menuService', function($rootScope) {
  var sharedService = {}

  sharedService.message = ''

  sharedService.prepForBroadcast = function(msg) {
    this.message = msg
    this.broadcastItem()
  }

  sharedService.broadcastItem = function() {
    $rootScope.$broadcast('handleBroadcast')
  }

  return sharedService
})
