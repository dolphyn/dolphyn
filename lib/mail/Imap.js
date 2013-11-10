

/*
 * <rant>
 *   this file is full of OMG OMG OMG crap. Needs some serious rewrite.
 * </rant>
 */

var imapLib = require("imap")
var inspect = require('util').inspect
var events  = require('events')
var util    = require('util')
var logger  = require('./../util/Logger.js')

var crypto  = require('crypto')

var imapInstances = {}

/**
 *
 * @events:
 *   - message
 *
 * @param config
 * @returns {*}
 * @constructor
 */
function Imap(config) {

  events.EventEmitter.call(this)

  var ready = false;

  // TODO: strip password form the logs
  logger.debug('IMAP connection: ' + config.user + '@' + config.host + ':' + config.port + (config.tls ? ' (secure)': ''))

  var self = this
  var client = new imapLib(config)

  this.search = function(criteria, callback) {
    client.search(criteria, function(err, result) {
      if(err) {
        callback(err, undefined)
      } else {
        self.fetchHeaders(result, function(err, messages) {
          callback(err, messages)
        })
      }
    })
  }

  var MailParser = require('mailparser').MailParser

  this.isReady = function() {
    return connected;
  }

  this.listUnread = function(callback) {
    client.search(['UNSEEN'], function(err, uids) {
      callback(err, uids)
    })
  }

  this.listRead = function(callback) {
    client.sort(['-DATE'], ['SEEN'], function(err, uids) {
      callback(err, uids)
    })
  }

  this.addFlags = function() {
    return client.addFlags.apply(client, arguments)
  }
  this.setFlags = function() {
    return client.setFlags.apply(client, arguments)
  }

  this.fetch = function(criteria, options) {

    var f = client.fetch(criteria, options)

    var eventEmitter = new events.EventEmitter

    f.on('message', function(msg, seqno) {

      var parser = new MailParser()

      var attributes

      parser.on('end', function(mailObj) {

        mailObj.box = self.currentBox.name
        mailObj.seqno = seqno
        mailObj.attributes = attributes

        if(attributes && attributes.flags && attributes.flags.indexOf('\\Seen') === -1) {
          mailObj.isUnread = true
        } else {
          mailObj.isUnread = false
        }

        if(!mailObj.html && mailObj.text) {
          mailObj.html = mailObj.text.replace(/\n/g, '<br/>')
        }

        var sanitizer = require('html-css-sanitizer')
        function urlX(u) { return u } //url transformer (noop here)
        function idX(id) { return id } //id transformer (noop here)

        if(mailObj.html) {
          mailObj.html = sanitizer.smartSanitize(mailObj.html, urlX, idX)
        }

        eventEmitter.emit('message', mailObj)
      })

      msg.on('body', function(stream, info) {

        var buffers = {}

        if(/^HEADER/.test(info.which)) {
          info.which = 'HEADER'
        }

        if(!buffers[info.which]) {
          buffers[info.which] = ''
        }

        stream.on('data', function(chunk) {
          buffers[info.which] += chunk.toString('utf8')
          parser.write(chunk.toString('utf8'))
        })

        stream.once('end', function() {
        })
      })

      msg.once('attributes', function(attrs) {
        attributes = attrs
      })

      msg.once('end', function() {
        parser.end()
      })
    })

    f.once('error', function(err) {
      logger.error(err)
      eventEmitter.emit('error', err)
    })

    f.once('end', function() {
    })

    return eventEmitter
  }

  this.fetchFull = function(criteria) {
    logger.debug('fetchFull:' + criteria)
    return this.fetch(criteria, {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true,
      struct: true
    })
  }

  this.fetchHeaders = function(criteria) {
    logger.debug('fetchHeaders:' + criteria)
    return this.fetch(criteria, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
      struct: true
    })
  }

  this.openBox = function(boxName, callback) {

    client.openBox(boxName, false, function(err, box) {
      if(err) {
        logger.error(err)
        callback(err, undefined)
      } else {
        self.currentBox = box
        callback(undefined, box)
      }

    })
  }

  this.sort = function(sortCriteria, searchCriteria, callback) {
    client.sort(sortCriteria, searchCriteria, callback)
  }

  client.on('error', function(err) {
    logger.error(err)
    self.emit('error', err)
  })

  client.once('end', function() {
    logger.info('Connection ended')
    self.emit('end')
  })

  var connected = false
  var connecting = false

  function connect() {

    if(!connecting && !connected) {
      connecting = true
      client.connect()
      client.once('ready', function() {
        connecting = false
        connected = true
        logger.info('imap client is ready')
        self.emit('ready')
      })

      client.on('mail', function(messageId) {

        logger.info('new mail ['+messageId+']')
//        imapClient.fetchFull(messageId, )
//        console.log(count)
        self.sort(['DATE'], ['RECENT'], function(err, mailUids) {
          if(err) {
            logger.error(err)
          } else if(mailUids) {
            for(var i = 0 ; i < mailUids.length ; i++) {
              var f = self.fetchHeaders(mailUids[i])
              f.on('message', function(message) {
                self.emit('message', message)
              })
            }
          }
        })
      });

    }
  }

  this.close = function() {
    if(connected) {
      client.close()
      client.once('closed', function() {
        self.emit('close')
      })
    }
  }

  client.on('closed', function() {
    logger.info('Imap conection closed')
    connected = false
  })

  var watchedBoxes

  function watchBoxes(callback) {
    client.getBoxes(function(err, boxes) {
      if(err) return callback(err)

      Imap.walkBoxes(boxes, function(boxName) {
        watchedBoxes.push(boxName)
        client.subscribeBox(boxName, function(err) {
          if(err) logger.error(err)
        })
      })

    })
  }

  function unwatchBoxes() {
    Imap.walkBoxes.forEach(function(boxName) {
      client.ubsubscribeBox(boxName, function(err) {
        if(err) logger.error(err)
      })
    })
    watchedBoxes = [];
  }

  connect()

}

util.inherits(Imap, events.EventEmitter)

Imap.walkBoxes = function(boxes, prefix_or_callback, callback) {
  if(!boxes) {
    return
  }

  var prefix
  if(!callback) {
    callback = prefix_or_callback
    prefix = ''
  } else {
    prefix = prefix_or_callback
  }

  for(var boxName in boxes) {
    var fullBoxName = prefix + boxName
//    console.log('1:' + fullBoxName)
    setImmediate(function(boxName) {
      return function() {
        callback(boxName)
      }
    }(fullBoxName))


    this.walkBoxes(boxes[boxName].children, fullBoxName + boxes[boxName].delimiter, callback)
  }

}

Imap.parseEmailAddress = function(address) {

  var name = address.match(/^"?([^"]+)"?\s*<.*>$/im)

  var email = address.match(/<([^<>]*)>$/im)

  var parsed = {
    name: name ? name[1].trim() : null,
    email: email ? email[1].trim() : null
  }

  if(!parsed.email) {
    parsed.email = address
  }
  if(!parsed.name) {
    parsed.name = parsed.email
  }

  return parsed;
}

function getImapHandle(config) {

  var shasum = crypto.createHash('sha512')
  shasum.update(config.username + config.password + config.host + config.port)
  var hash = shasum.digest('hex')

  if(imapInstances.hasOwnProperty(hash)) {
    logger.info('Matched configuration with an existing one. Returning existing Imap instance')
  } else {
    logger.info('Could not match configuration with an existing one. Creating a new connection')
    imapInstances[hash] = new Imap(config)
  }

  return imapInstances[hash]
}

module.exports = getImapHandle