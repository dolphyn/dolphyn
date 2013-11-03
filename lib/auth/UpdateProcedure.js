
var ConfMgr         = require('../../install/ConfigurationManager.js')
var logger          = require('../util/Logger.js')

var yubico          = ConfMgr.readConf('yubico.enabled') || false

// role should be one of required | optional
var middlewares = []

middlewares.push({
  name: 'password reset',
  middleware: require('./middleware/reset.js'),
  role: 'required'
})

middlewares.push({
  name: 'password',
  middleware: require('./middleware/password.js'),
  role: 'required'
})

if(yubico) {
  middlewares.push({
    name: 'yubikey',
    middleware: require('./middleware/yubikey.js'),
    role: 'required'
  })
}

middlewares.push({
  name: 'imap',
  middleware: require('./middleware/imap.js'),
  role: 'optional'
})

middlewares.push({
  name: 'smtp',
  middleware: require('./middleware/smtp.js'),
  role: 'optional'
})

middlewares.push({
  name: 'email',
  middleware: require('./middleware/email.js'),
  role: 'optional'
})

function AuthenticationProcedure() {

  var iteration = 0;

  this.run = function(credentials, account, session, callback) {
    next(credentials, account, session, function(err) {
      callback(err)
    })
  }

  function next(credentials, account, session, callback) {
    if(middlewares.length > iteration) {
      var m = middlewares[iteration]
      logger.info('auth middleware ['+m.name+']')
      m.middleware.auth(credentials, account, function(err, middlewareSession) {
        session[m.name] = middlewareSession
        if(err && m.role === 'required') {
          setImmediate(function() {
            callback(err)
          })
        } else {
          iteration ++
          setImmediate(function() {
            next(credentials, account, session, callback)
          })
        }
      })
    } else {
      setImmediate(function() {
        callback()
      })
    }
  }

}

module.exports = AuthenticationProcedure