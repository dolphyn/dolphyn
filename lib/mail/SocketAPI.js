
var getImapHandle         = require('./Imap.js')
var logger                = require('./../util/Logger.js')
var AccountManagement     = require('../account/AccountManagement.js')
var cookie                = require('cookie')

function attach(socket) {
  var cookies = cookie.parse(socket.handshake.headers['cookie']);

  socket.emit('unauth:user')

  socket.on('auth:user', function(credentials) {
    logger.info('Authenticating user ['+credentials.email+']')
    AccountManagement.login(credentials.email, credentials.password, function(err, account) {
      if(err) {
        socket.emit('auth:user', err)
      } else {
        if(account.configured) {
          socket.emit('auth:user')
          attachAuth(socket, account)
        } else {
          socket.emit('config:user')
        }
      }
    })
  })

}

function attachAuth(socket, account) {
  var imapSettings = account.imap

  var imapConfig = {
    user: imapSettings.username,
    password: imapSettings.password,
    host: imapSettings.host,
    port: imapSettings.port,
    tls: imapSettings.secure,
    tlsOptions: { rejectUnauthorized: false },
    autotls: 'never' // always | require | never
  }

  var imapClient = getImapHandle(imapConfig)


  if(imapClient.isReady()) {
    logger.info('> ready')
    socket.emit('ready')
  } else {
    imapClient.on('ready', function() {
      logger.info('> ready')
      socket.emit('ready')
    })
  }

  imapClient.on('error', function(err) {
    logger.error(err)
  })

  imapClient.on('message', function(message) {
    console.log('sending new message ['+message.attributes.uid+']')
    socket.emit('list:conversations', [message])
  })

  var retrieveConversationQueue = []

  socket.on('list:conversations', function(messagesUids) {
    logger.info('list:conversations')
    var f = imapClient.fetchHeaders(messagesUids);
    f.on('message', function(message) {
      socket.emit('list:conversations', [message]);
    })
  })

  socket.on('open:box', function(boxName) {


    imapClient.openBox(boxName, function(err, box) {

      logger.info('> open:box')
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

      logger.info('> seen: '+seen.length)

      socket.emit('list:seen', seen)
    })
  })

  socket.on('list:unseen:conversations', function() {

    logger.info('list:unseen:conversations')

    imapClient.listUnread(function(err, result) {
      if(err) logger.error(err)

      logger.info('unseen: '+JSON.stringify(result))
      if(result && result.length > 0) {
        var f = imapClient.fetchHeaders(result)
        f.on('message', function(message) {
          console.log('sending list:unseen:conversations ['+message.attributes.uid+']')
          socket.emit('list:unseen:conversations', [message])
        })

        f.on('error', function(err) {
          logger.error(err)
        })
      }
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
    f.on('message', function(message) {
      console.log('sending message ['+message.attributes.uid+'] with flags '+ JSON.stringify(message.attributes.flags))
      socket.emit('get:message', message)
    })
    f.on('error', function(err) {
      logger.error(err)
    })
  })

  socket.on('get:settings', function() {

    var settings = {
      imap: account.imap,
      smtp: account.smtp
    }

    socket.emit('get:settings', settings)
  })

  socket.on('save:settings', function(settings) {
    AccountManagement.saveSettings(account.email, settings, function(err, savedAccount) {
      if(err) {
        logger.error(err)
        socket.emit('error:settings', err)
      } else {
        account.imap = savedAccount.imap
        account.smtp = savedAccount.smtp
        account.configured = true
        //session.save();
        logger.info('[' + account.email + '] settings updated')
        socket.emit('ok:settings')
      }
    })
  })

}



module.exports = {
  attach: attach
}