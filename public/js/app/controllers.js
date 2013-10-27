'use strict';

/* Controllers */

app.controller('MenuCtrl', function($scope, socket, $sce, $routeParams, menuService) {

  $scope.currentMenu = getCurrentMenu();

//  setTimeout(function() {
//    menuService.prepForBroadcast({"foo": "bar"});
//  }, 20000);

  $scope.unreadCount = '';
  $scope.$on('handleBroadcast', function() {
    if(menuService.message && menuService.message.unreadCount) {
      $scope.unreadCount = menuService.message.unreadCount;
    }
  });

  function getCurrentMenu() {
    var url = $.url();
    var anchor = url.attr('anchor');
    if(anchor) {
      // TODO: be more strict with this regexp
      var neverKnewHowToNameThis = anchor.match(/(\w+)/gmi);
      if(neverKnewHowToNameThis && neverKnewHowToNameThis.length > 1) {
        return neverKnewHowToNameThis[1];
      } else {
        return neverKnewHowToNameThis[0];
      }

    }
  }

  $scope.changeMenu = function(menu) {
    $scope.currentMenu = menu;
  }

});

var boxes = {}

function SettingsCtrl($scope, socket, $sce, $routeParams, menuService) {

  $scope.saving = false;

  socket.emit('get:settings', undefined);

  socket.on('get:settings', function (settings) {
    $scope.settings = settings;
  });

  socket.on('error:settings', function (err) {
    $scope.saving = false;
    console.log(err);
  });

  socket.on('ok:settings', function () {
    $scope.saving = false;
  });


  $scope.save = function() {
    $scope.saving = true;
    socket.emit("save:settings", $scope.settings);
    return false;
  };
}

function ComposeCtrl($scope, socket, $sce, $routeParams, menuService) {

}

function BoxCtrl($scope, socket, $sce, $routeParams, menuService) {
  $scope.boxId = $routeParams.boxId[0];
  $scope.boxId += $routeParams.boxId.substr(1).toLowerCase();

  $scope.$on('handleBroadcast', function() {
//    console.log("received: " + JSON.stringify(menuService.message));
  });



  // Socket listeners
  // ================
//
//  function attachList() {
//    if($('#list')) {
//      $('#list').bind('scroll', function(){
//        if(endReached(this)) {
//          loadNext();
//        }
//      });
//    } else {
//      setTimeout(attachList, 100);
//    }
//  }
//
//  attachList();

  var itemsPerRetrieve = 10;

  var paging = {
    from: 0,
    to: itemsPerRetrieve
  };

//  init();

  $scope.loadMore = function() {
    loadNext();
  };

  function endReached(self) {
    if(self && self[0]) {
      var end = ($(self).scrollTop() + $(self).innerHeight() >= $(self)[0].scrollHeight - 100);
      if(end) {
//        console.log("end");
      }
      return end;
    } else {
      return false;
    }
  }

  var throttle = false;

  socket.on('ready', function() {
    socket.emit('open:box', 'INBOX');
  })

  socket.on('open:box', function(err, box) {
    if(err) throw err
    else console.log(box)
    socket.emit("list:unseen:conversations");
  })

  function loadNext() {
    if(!throttle) {
      $scope.loading = true;
      throttle = true;

      socket.emit("list:conversations", paging);

      paging = {
        from: (paging.from + itemsPerRetrieve),
        to: (paging.to + itemsPerRetrieve)
      };

      setTimeout(function() {
        throttle = false;
      }, 300)
    }
  }

  $scope.unreadCount = 0;


  socket.on("list:unseen:conversations", function (messages) {
    loadMessages(messages)
  });

  socket.on('list:conversations', function (messages) {

    loadMessages(messages)

  });

  function loadMessages(messages) {

    $scope.loading = false;

    for(var i = messages.length-1 ; i >= 0 ; i--) {
      messages[i].date = new Date(messages[i].headers.date);

      messages[i].readableTime =
        messages[i].date.getHours() +
          ":" +
          (messages[i].date.getMinutes() < 10 ? "0" : "") +
          messages[i].date.getMinutes();

      if(messages[i].isUnread) {
        $scope.unreadCount ++;
      }

      $scope.messages.push(messages[i]);

    }

    menuService.prepForBroadcast({unreadCount: $scope.unreadCount});

    $scope.messages.sort(sortByUnseenThenDate)
  }

  function sortByUnseenThenDate(a, b) {
    var order = sortBySeen(a, b);

    if(order === 0) {
      order = sortByDate(a, b);
    }

    return order;
  }

  function sortByDate(a, b) {
    if(a.date < b.date) {
      return 1;
    } else if(a.date > b.date) {
      return -1;
    } else {
      return 0;
    }
  }

  function sortBySeen(a, b) {

    var res = 0;

    if(a.isUnread && !b.isUnread) {
      res = -1;
    } else if(!a.isUnread && b.isUnread) {
      res = 1;
    }

    return res;
  }

  var markAsReadTimeout

  socket.on('get:message', function (messageWithBody) {
    console.log(messageWithBody)

    var message = replaceExistingMessage(messageWithBody)
    // TODO: cache message
    // make sure the message is the currently selected one
    if(message &&
      (!$scope.selectedMessage ||
        $scope.selectedMessage.attributes.uid === messageWithBody.attributes.uid)) {

      if(typeof messageWithBody.html === "string") {
        message.trustedHtml = $sce.trustAsHtml(messageWithBody.html);
      }

      // replace in the message list instead of selectedMessage
      $scope.selectedMessage = message;

      if(message.isUnread) {
        socket.emit('read:message', message.attributes.uid);
      }
    }
  });

  socket.on('read:message', function(ack) {
    console.log(ack)
    var message = lookupMessage(ack.messageUid)
    if(message && !ack.ok) {
      message.isUnread = true;
    } else if(message) {
      console.log('message marked as read')
      message.isUnread = false;
    } else {
      throw new Error('Could not match message')
    }
  });

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
        if($scope.messages[i].attributes && $scope.messages[i].attributes.uid === newVersion.attributes.uid) {
          $scope.messages[i] = newVersion
          return newVersion
        }
      }
    }
    return undefined
  }

  $scope.getMessage = function (message) {
    $scope.selectedMessage = message;

    // only load message if it does not have it's body yet
    if(message && !message.trustedHtml && message.attributes && message.attributes.uid) {
      socket.emit('get:message', message.attributes.uid);
    }
  };

  window.iResize = function() {
    var iFrames = $('iframe');
    for (var i = 0, j = iFrames.length; i < j; i++) {
      iFrames[i].style.height = (iFrames[i].contentWindow.document.body.offsetHeight + /*arbitrary*/50) + 'px';
    }
  }

  $scope.messages = [];
  $scope.selectedMessage;
}