'use strict'

/* Controllers */

app.controller('MenuCtrl', function($scope, $log, $routeParams, $location, menuService) {

  $scope.currentMenu = $routeParams.menuItem
  $scope.unreadCount = ''

  $scope.$on('handleBroadcast', function() {
    if(menuService.message && menuService.message.unreadCount) {
      if(menuService.message.unreadCount == 0) {
        $scope.unreadCount = ''
      } else {
        $scope.unreadCount = menuService.message.unreadCount
      }
    }
  })

  $scope.changeMenu = function(menu) {
    $scope.currentMenu = menu
  }

})

function AppCtrl($scope, socket, $routeParams, $location, menuService) {
  socket.on('unauth:user', function() {
    if($location.path() !== '/login') {
      $location.path('/login')
    }
  })
}

function SettingsCtrl($scope, socket, $sce, $log) {
  $log.info('SettingsCtrl')

  $scope.saving = false

  $log.info('> get:settings')
  socket.emit('get:settings', undefined)

  socket.on('get:settings', function (settings) {
    $log.info('< get:settings')
    $scope.settings = settings
  })

  socket.on('error:settings', function (err) {
    $log.error(err)
    $scope.saving = false
    console.log(err)
  })

  socket.on('ok:settings', function () {
    $log.info('< ok:settings')
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

function ComposeCtrl($scope, socket, $sce, $routeParams, menuService) {

}

function LoginCtrl($scope, socket, $location, $log, $rootScope) {

  $rootScope.logout = function() {
    $log.info("logout")
    socket.emit('unauth:user')
  }

  $scope.login = function() {
    // TODO: spinner
    $rootScope.authenticated = false
    socket.emit('auth:user', {
      email: $scope.email,
      password: $scope.password
    })
    return false
  }

  socket.on('auth:user', function(err) {
    if(err) {
      $rootScope.authenticated = false
      $log.error(err)// TODO: login feedback
    } else {
      $log.info('authenticated')
      $rootScope.authenticated = true
      $location.path('/app/INBOX')
    }
  })

  $scope.$on('$destroy', function (event) {
    socket.removeAllListeners();
  });
}

function MenuPageCtrl($scope, $routeParams, $log) {
  $log.info('MenuPageCtrl:' + $routeParams.menuItem)

  if($routeParams.menuItem === 'Settings') {
    $scope.template = '/partials/settings.html'
  } else {
    $scope.template = '/partials/box.html'
  }
}

function BoxCtrl($rootScope, $scope, socket, $sce, $routeParams, menuService, $log) {

  $log.log('BoxCtrl')

  function unreadCount(value) {
    if(value !== undefined) {
      $scope.unreadCount = value
      menuService.prepForBroadcast({unreadCount: $scope.unreadCount})
    }
    if($scope.unreadCount === undefined) {
      $scope.unreadCount = 0
    }
    return $scope.unreadCount
  }

  $scope.boxId = $routeParams.menuItem

  $scope.$on('handleBroadcast', function() {
  })

  var itemsPerRetrieve = 10

  var paging = {
    from: 0,
    to: itemsPerRetrieve
  }

  $scope.loadMore = function() {
    $log.info('loading more mail')
    loadNext()
  }

  function endReached(self) {
    if(self && self[0]) {
      var end = ($(self).scrollTop() + $(self).innerHeight() >= $(self)[0].scrollHeight - 100)
      return end
    } else {
      return false
    }
  }

  var throttle = false

  if(!$rootScope.ready) {
    socket.on('ready', function() {
      $rootScope.ready = true
      $log.info('< ready')
      $log.info('> open:box ['+$scope.boxId+']')
      socket.emit('open:box', $scope.boxId)
    })
  } else {
    $log.info('> open:box ['+$scope.boxId+']')
    socket.emit('open:box', $scope.boxId)
  }

  socket.on('open:box', function(err, box) {
    if(err) {
      $log.error(err)
    } else {
      $log.info('< open:box ['+box.name+']')
      socket.emit("list:unseen:conversations")
      socket.emit("list:seen")
    }
  })

  var seenMessagesUids = []
  var currentMessageIndex = 0
  socket.on('list:seen', function(seenUids) {

    $log.info('< list:seen ['+seenUids.length+']')

    seenMessagesUids = seenUids
    loadNext()
  })

  function loadNext() {
    if(!throttle) {
      $scope.loading = true
      throttle = true

      var messagesUids = seenMessagesUids.slice(
        currentMessageIndex,
        Math.min(currentMessageIndex+10, seenMessagesUids.length)
      )

      currentMessageIndex += 10

      if(messagesUids.length > 0) {
        $log.info('> list:conversations '+JSON.stringify(messagesUids))
        socket.emit("list:conversations", messagesUids)
      }

      setTimeout(function() {
        throttle = false
      }, 300)
    }
  }


  socket.on("list:unseen:conversations", function (messages) {
    loadMessages(messages)
  })

  socket.on('list:conversations', function (messages) {

    loadMessages(messages)

  })

  function loadMessages(messages) {

    $scope.loading = false

    for(var i = messages.length-1 ; i >= 0 ; i--) {

      if(lookupMessage(messages[i].attributes.uid)) {
        replaceExistingMessage(messages[i])
        continue
      }

      messages[i].date = new Date(messages[i].headers.date)

      messages[i].readableTime =
        messages[i].date.getHours() +
          ":" +
          (messages[i].date.getMinutes() < 10 ? "0" : "") +
          messages[i].date.getMinutes()

      if(messages[i].isUnread) {
        var cnt = unreadCount()
        unreadCount(cnt++)
      }

      $scope.messages.push(messages[i])

    }

    $scope.messages.sort(sortByUnseenThenDate)
  }

  function sortByUnseenThenDate(a, b) {
    var order = sortBySeen(a, b)

    if(order === 0) {
      order = sortByDate(a, b)
    }

    return order
  }

  function sortByDate(a, b) {
    if(a.date < b.date) {
      return 1
    } else if(a.date > b.date) {
      return -1
    } else {
      return 0
    }
  }

  function sortBySeen(a, b) {

    var res = 0

    if(a.isUnread && !b.isUnread) {
      res = -1
    } else if(!a.isUnread && b.isUnread) {
      res = 1
    }

    return res
  }

  socket.on('get:message', function (messageWithBody) {
    $log.info('received full message '+messageWithBody.attributes.uid)

    var message = replaceExistingMessage(messageWithBody)
    // TODO: cache message
    // make sure the message is the currently selected one
    if(message &&
      (!$scope.selectedMessage ||
        $scope.selectedMessage.attributes.uid === messageWithBody.attributes.uid)) {

      if(typeof messageWithBody.html === "string") {
        message.trustedHtml = $sce.trustAsHtml(messageWithBody.html)
      }

      // replace in the message list instead of selectedMessage
      $scope.selectedMessage = message
    }
  })

  socket.on('read:message', function(ack) {
    console.log(ack)
    var message = lookupMessage(ack.messageUid)
    if(message && !ack.ok) {
      message.isUnread = true
    } else if(message) {
      console.log('message marked as read')
      message.isUnread = false
    } else {
      throw new Error('Could not match message')
    }
  })

  function lookupMessage(uid) {
    if($scope.messages) {
      for(var i = 0 ; i < $scope.messages.length ; i++) {
        if($scope.messages[i].attributes && $scope.messages[i].attributes.uid === uid) {
          return $scope.messages[i]
        }
      }
    }
    return undefined
  }

  function replaceExistingMessage(newVersion) {
    if($scope.messages) {
      for(var i = 0 ; i < $scope.messages.length ; i++) {
        // TODO: decrement unreadCount()
        if($scope.messages[i].attributes && $scope.messages[i].attributes.uid === newVersion.attributes.uid) {
          $scope.messages[i] = newVersion
          return newVersion
        }
      }
    }
    return undefined
  }

  $scope.getMessage = function (message) {
    $scope.selectedMessage = message

    // only load message if it does not have it's body yet
    if(message && !message.trustedHtml && message.attributes && message.attributes.uid) {
      socket.emit('get:message', message.attributes.uid)
    }
  }

  window.iResize = function() {
    var iFrames = $('iframe')
    for (var i = 0, j = iFrames.length; i < j; i++) {
      iFrames[i].style.height = (iFrames[i].contentWindow.document.body.offsetHeight + /*arbitrary*/50) + 'px'
    }
  }

  $scope.messages = []
  $scope.selectedMessage

  $scope.$on('$destroy', function (event) {
    socket.removeAllListeners();
  });
}