/** This is some kind of middleware (think express) like authentication mechanism.
 *
 * Credentials are passed to an authenticationProcedure which checks against all the middleware it has.
 *
 * Each middleware is passed the credentials and has the ability to export session data.
 *
 * Thus, an authenticationProcedure handles both the actual authentication but also the account session.
 *
 * @type {exports|*}
 */


var ConfMgr         = require('../../install/ConfigurationManager.js')
var logger          = require('../util/Logger.js')

var yubico          = ConfMgr.readConf('yubico.enabled') || false

// role should be one of required | optional
var middlewares = []

//middlewares.push({
//  name: 'password reset',
//  middleware: require('./middleware/reset.js'),
//  role: 'required'
//})

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
  role: 'required'
})

middlewares.push({
  name: 'smtp',
  middleware: require('./middleware/smtp.js'),
  role: 'required'
})

middlewares.push({
  name: 'email',
  middleware: require('./middleware/email.js'),
  role: 'required'
})

function AuthenticationProcedure() {

  // TODO: fix vulnerability. iteration should be scoped within the auth and update methods
  var iteration;

  this.auth = function(credentials, account, session, callback) {
    iteration = 0
    logger.info('['+account.email+'] running authentication procedure')
    nextAuth(credentials, account, session, function(err) {
      callback(err)
    })
  }

  this.update = function(oldCredentials, newCredentials, account, session, callback) {
    iteration = 0
    logger.info('['+account.email+'] running authentication procedure')
    nextUpdate(oldCredentials, newCredentials, account, session, function(err) {
      callback(err)
    })
  }

  // TODO: merge nextAuth and nextUpdate
  // TODO: update should return a new session object

  function nextAuth(credentials, account, session, callback) {
    if(middlewares.length > iteration) {
      var m = middlewares[iteration]
      iteration ++
      if(m.middleware.auth) {
        logger.info('auth middleware ['+m.name+']')
        m.middleware.auth(credentials, account, function(err, middlewareSession) {
          session[m.name] = middlewareSession
          if(err && m.role === 'required') {
            setImmediate(function() {
              callback(err)
            })
          } else {
            setImmediate(function() {
              nextAuth(credentials, account, session, callback)
            })
          }
        })
      } else {
        setImmediate(function() {
          nextAuth(credentials, account, session, callback)
        })
      }
    } else {
      setImmediate(function() {
        callback()
      })
    }
  }

  function nextUpdate(oldCredentials, newCredentials, account, session, callback) {
    if(middlewares.length > iteration) {
      var m = middlewares[iteration]
      iteration ++
      if(m.middleware.update) {
        logger.info('update middleware ['+m.name+']')
        m.middleware.update(oldCredentials, newCredentials, account, session[m.name], function(err) {
          // All update middleware are optionals. We want to go through all of them, even if one or more fails
          setImmediate(function() {
            nextUpdate(oldCredentials, newCredentials, account, session, callback)
          })
        })
      } else {
        setImmediate(function() {
          nextUpdate(oldCredentials, newCredentials, account, session, callback)
        })
      }
    } else {
      setImmediate(function() {
        callback()
      })
    }
  }

}

module.exports = AuthenticationProcedure