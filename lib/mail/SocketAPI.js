
var getImapHandle         = require('./Imap.js')
var getSMTPHandle         = require('./Smtp.js')
var logger                = require('./../util/Logger.js')
var AccountManagement     = require('../account/AccountManagement.js')
var cookie                = require('cookie')

function attach(socket) {
//  if(socket.handshake.headers['cookie']) {
//    var cookies = cookie.parse(socket.handshake.headers['cookie']);
//  }

  socket.emit('unauth:user')

  socket.on('auth:user', function(credentials) {
    logger.info('Authenticating user ['+credentials.email+']')
    AccountManagement.login(credentials.email, credentials, function(err, session) {
      if(err) {
        socket.emit('auth:user', err)
      } else {
//        if(account.configured) {
          socket.emit('auth:user')
          attachAuth(socket, session)
//        } else {
//          socket.emit('config:user')
//        }
      }
    })
  })

}

function attachAuth(socket, session) {
  var imapSettings = session.imap

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

      logger.info('> open:box ['+box+']')
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
          if(err.code === 'ENETDOWN') {
            logger.warn('ENETDOWN --> trying to reconnect in 10 seconds')
            setTimeout(connect, 10 * 1000)
          }
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
      imap: session.imap,
      smtp: session.smtp
    }

    socket.emit('get:settings', settings)
  })

  socket.on('save:settings', function(settings) {
    AccountManagement.saveSettings(session.email, settings, function(err, savedAccount) {
      if(err) {
        logger.error(err)
        socket.emit('error:settings', err)
      } else {
        // the session logic should be in saveSettings()
        session.imap = settings.imap
        session.smtp = settings.smtp
        session.configured = true
        //session.save()
        logger.info('[' + session.email + '] settings updated')
        socket.emit('ok:settings')
      }
    })
  })

  socket.on('search:box', function(searchString) {

    logger.info('search:box ' + searchString)

    imapClient.search(['ALL', ['TEXT', searchString]], function(err, uids) {
      logger.info('search' + searchString + ' returned '+JSON.stringify(uids))
      socket.emit('list:seen', uids);
    })
  })

  socket.on('disconnect', function() {
    logger.info('disconnected ['+session.email+']')
    if(imapClient) {
      // don't remove all, should still allow for multiple clients to use the same imap connection
      imapClient.removeAllListeners()
    }
  })


  socket.on('send:message', function(message) {
    logger.info('> send:message')
    var smtp = getSMTPHandle(session)

    smtp.sendMail(message.to, message.subject, message.html)

  })

}



module.exports = {
  attach: attach
}