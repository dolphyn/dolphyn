
var logger            = require('../util/Logger.js')
var FieldError        = require('../error/Errors.js').FieldError
var DBHelper          = require('../database/DBHelper.js').DBHelper
var AuthProcedure     = require('../auth/AuthProcedure.js')
var Pwd               = require('../auth/middleware/password.js')
var ImapMdlware       = require('../auth/middleware/imap.js')
var SmtpMdlware       = require('../auth/middleware/smtp.js')

var auth              = new AuthProcedure()

AccountManagement = {}

AccountManagement.login = function(email, credentials, callback) {

  if(!AccountManagement.looksLikeAnEmail(email)) {
    setImmediate(function() {
      var err = new FieldError(FieldError.TYPES.WRONG_FORMAT, 'email', 'john-doe@john-doe-enterprises.tld')
      logger.error(err)
      callback(err, undefined)
    })
    return
  }

  DBHelper.Account.findByKey(email, function(err, account) {
    if(err) {
      logger.error(err)
      callback(err, undefined)

    } else if(!account) {

      logger.info("["+email+"] creating new account")

      var emailInfo = email.split('@')

      var username = emailInfo[0]
      var domain = emailInfo[1]

      var imap = {
        username: username,
        password: '',
        host: 'imap.' + domain,
        port: 993,
        secure: true
      }

      var smtp = {
        username: username,
        password: '',
        host: 'smtp.' + domain,
        port: 587,
        secure: true
      }

      account = {
        email: email,
        configured: false,
        imap: imap,
        smtp: smtp
      }
    }

    var session = {}

    if(!credentials.password) {
      credentials.password = ''
    }

    auth.auth(credentials, account, session, function(err) {
      if(err) {
        logger.warn("["+email+"] authentication failure")
        callback(err, undefined)
      } else {
        logger.info("["+email+"] authentication success")

        DBHelper.Account.save(account, function(err, savedAccount) {
          if(err) {
            logger.error(err)
            callback(err, undefined)
          } else {
            logger.info("["+email+"] account saved")
            callback(undefined, session)
          }
        })
      }
    })
  })
}

AccountManagement.filterAccount = function(account, password) {
  var filtered = {
    email: account.email,
    configured: account.configured,
    imap: account.imap,
    smtp: account.smtp
  }
  return filtered
}

AccountManagement.saveSettings = function(email, settings, callback) {
  DBHelper.Account.findByKey(email, function(err, account) {
    if(err) {
      callback(err)
    } else {
      account.imap = settings.imap
      account.smtp = settings.smtp
      account.configured = true

      var oldCredentials = {
        password: settings.oldPassword
      }

      var newCredentials = {
        password: settings.newPassword
      }
      var session = {}
      auth.update(oldCredentials, newCredentials, account, session, function(updateErr) {

        if(updateErr) {

          DBHelper.Account.save(account, function(saveErr, savedAccount) {
            if(saveErr) {
              logger.error(saveErr)
            }
            // TODO: return all errors
            callback(updateErr, undefined)
          })

        } else {

          DBHelper.Account.save(account, function(err, savedAccount) {
            callback(err, session)
          })
        }
      })
    }
  })
}


AccountManagement.looksLikeAnEmail = function(email) {
  return /.+@.+/.test(email)
}

module.exports = AccountManagement;