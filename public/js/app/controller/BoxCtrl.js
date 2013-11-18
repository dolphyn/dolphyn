

function BoxCtrl($rootScope, $scope, socket, $sce, $routeParams, $location, menuService, $log) {

  $scope.messages = []
  $scope.selectedMessage

  $log.log('BoxCtrl')

  $scope.loading = true

  function unreadCount(value) {
    if(value !== undefined) {
      $scope.unreadCount = value
      $log.log('unreadCount = ' + $scope.unreadCount)
      menuService.prepForBroadcast({unreadCount: $scope.unreadCount})
    }
    if($scope.unreadCount === undefined) {
      $scope.unreadCount = 0
    }

    return $scope.unreadCount
  }

  $scope.boxId = $routeParams.menu

  if($routeParams.menu === 'Drafts') {
    $scope.edit = true
  }

  if($routeParams.resource === 'new') {
    $scope.selectedMessage = {}
  }

  $scope.search = function() {
//    $location.search('any', $scope.searchString)
//    $location.path('/app/' + $scope.boxId + '/search')

    console.log('SEARCH: '+$scope.searchString)
    socket.emit('search:box', $scope.searchString)

    $scope.messages = []
    $scope.selectedMessage = null

    $scope.loading = true
  }

  if($routeParams.menu) {
    $scope.title = $routeParams.menu[0]
    $scope.title += $routeParams.menu.slice(1).toLowerCase()
  } else {
    $scope.title = ''
  }

  $scope.$on('handleBroadcast', function() {
  })

  var itemsPerRetrieve = 10

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
      socket.emit('open:box', $scope.boxId)
    })
  } else {
    socket.emit('open:box', $scope.boxId)
  }

  socket.on('open:box', function(err, box) {
    if(err) {
      $log.error(err)
    } else {
      $location.search('any', null)
      socket.emit("list:unseen:conversations")
      socket.emit("list:seen")
    }
  })

  var seenMessagesUids = []
  var currentMessageIndex = 0
  socket.on('list:seen', function(seenUids) {
    $scope.messages = []
    $scope.selectedMessage = null

    if(seenUids && seenUids.length > 0) {
      currentMessageIndex = 0
      seenMessagesUids = seenUids
      loadNext()
    } else {
      // TODO: display no results
      $log.info('no results')
      $scope.loading = false
    }
  })

  function loadNext() {
    if(!throttle) {
      $scope.loading = true
      throttle = true

      var messagesUids = seenMessagesUids.slice(
        currentMessageIndex,
        Math.min(currentMessageIndex + itemsPerRetrieve, seenMessagesUids.length)
      )

      currentMessageIndex += itemsPerRetrieve

      if(messagesUids.length > 0) {
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

      addReadableDate(messages[i])

      if(messages[i].isUnread) {
        var cnt = unreadCount()
        unreadCount(++cnt)
      }

      $scope.messages.push(messages[i])

    }

    $scope.messages.sort(sortByUnseenThenDate)
  }

  function addReadableDate(message) {
    message.date = new Date(message.headers.date)

    message.readableTime =
      message.date.getHours() +
        ":" +
        (message.date.getMinutes() < 10 ? "0" : "") +
        message.date.getMinutes()
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

      message.readableDate = DateHumanize.humanize(new Date(message.headers.date))

      // replace in the message list instead of selectedMessage
      $scope.selectedMessage = message
    }
  })

  socket.on('read:message', function(ack) {
    var message = lookupMessage(ack.messageUid)
    if(message && !ack.ok) {
      message.isUnread = true
    } else if(message) {
      $log.info('marking message ['+ack.messageUid+'] as read')
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

          if($scope.messages[i].isUnread && !newVersion.isUnread) {
            var cnt = unreadCount()
            unreadCount(--cnt)
          }
          addReadableDate(newVersion)
          $scope.messages[i] = newVersion
          return newVersion
        }
      }
    }
    $scope.messages.sort(sortByUnseenThenDate)
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

  $scope.$on('$destroy', function (event) {
    socket.removeAllListeners();
  });

  $scope.send = function() {

    var message = {
      to: $scope.selectedMessage.to.split(','),
      subject: $scope.selectedMessage.subject,
      html: $scope.selectedMessage.html
    }

    socket.emit('send:message', message)
  }

}