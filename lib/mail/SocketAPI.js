
var getImapHandle = require("./Imap.js")
var logger        = require('./../util/Logger.js')

function attach(socket, session) {

  var imapSettings = session.account.imap

  var imapConfig = {
    user: imapSettings.username,
    password: imapSettings.password,
    host: imapSettings.host,
    port: imapSettings.port,
    tls: imapSettings.secure,
    tlsOptions: { rejectUnauthorized: false },
    autotls: "never" // always | require | never
  }

  var imapClient = getImapHandle(imapConfig)


  if(imapClient.isReady()) {
    socket.emit('ready')
  } else {
    imapClient.on('ready', function() {
      socket.emit('ready')
    })
  }

  imapClient.on('error', function(err) {
    logger.error(err)
  })

  imapClient.on('message', function(message) {
    console.log('sending message')
    socket.emit('list:conversations', [message])
  })

  var retrieveConversationQueue = []

  socket.on("list:conversations", function(paging) {
    console.log('fetch more')
    var f = retrieve(paging)
    f.on('message', function(message) {
      console.log('sending conversation')
      socket.emit('list:conversations', [message])
    })
  })


  function retrieve(paging) {

//    var from = imapClient.currentBox.messages.total - paging.from
//    var to   = imapClient.currentBox.messages.total - paging.to
//
//    var mailsToFetch = sortedMailUids.slice(sortedMailUids.length - paging.to, sortedMailUids.length - paging.from)

    var f = imapClient.fetchHeaders(['ALL'])

    return f

  }

  socket.on('open:box', function(boxName) {


    imapClient.openBox(boxName, function(err, box) {

      if(err) {
        socket.emit('open:box', err, undefined)
      } else {
        socket.emit('open:box', undefined, box)
      }

    });

  })

  socket.on('list:seen', function() {
    imapClient.listRead(function(err, seen) {
      if(err) logger.error(err)

      logger.info('seen: '+JSON.stringify(seen))

      socket.emit('list:seen', seen)
    })
  })

  socket.on('list:unseen:conversations', function() {

    logger.info('list:unseen:conversations')

    imapClient.listUnread(function(err, result) {
      if(err) logger.error(err)

      logger.info('unseen: '+JSON.stringify(result))

      var f = imapClient.fetchHeaders(result)
      f.on('message', function(message) {
        console.log('sending list:unseen:conversations ['+message.attributes.uid+']')
        socket.emit('list:unseen:conversations', [message])
      })

      f.on('error', function(err) {
        logger.error(err)
      })
    })
  })

  socket.on('read:message', function (messageUid) {
//    logger.info('Flagging message ['+messageUid+'] as read')
//    imapClient.setFlags(messageUid, 'Seen', function(err) {
//      if(err) {
//        logger.error(err)
//      } else {
//        logger.info('Flagged message ['+messageUid+'] as read')
//      }
//      // TODO: do not send error to the UI like that. filter it and add a nice message
//      socket.emit('read:message', {
//        ok: err ? false : true,
//        reason: err,
//        messageUid: messageUid
//      })
//    })
  })

  socket.on('get:message', function (messageUid) {
    var f = imapClient.fetchFull(messageUid)
    f.on("message", function(message) {
      console.log('sending message ['+message.attributes.uid+'] with flags '+ JSON.stringify(message.attributes.flags))
      socket.emit('get:message', message)
    })
    f.on("error", function(err) {
      logger.error(err)
    })
  })

  socket.on('get:settings', function() {

    var settings = {
      imap: session.account.imap,
      smtp: session.account.smtp
    }

    socket.emit('get:settings', settings)
  })

  socket.on('save:settings', function(settings) {
    AccountManagement.saveSettings(session.account.email, settings, function(err, account) {
      if(err) {
        logger.error(err)
        socket.emit('error:settings', err)
      } else {
        session.account.imap = settings.imap
        session.account.smtp = settings.smtp
        session.account.configured = true
        //session.save();
        logger.info('[' + session.account.email + '] settings updated')
        socket.emit('ok:settings')
      }
    })
  })
}

module.exports = {
  attach: attach
}