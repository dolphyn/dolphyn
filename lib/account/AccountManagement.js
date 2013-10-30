
var crypto            = require('crypto')
var logger            = require('../util/Logger.js')
var Security          = require('../util/Security.js')
var FieldError        = require('../error/Errors.js').FieldError
var DBHelper          = require('../database/DBHelper.js').DBHelper

var ConfMgr         = require("../../install/ConfigurationManager.js")

var hashIterations = ConfMgr.readConf('application.hashAlgorithmIterations') || 20000

logger.info("The password hashing algorithm will use ["+hashIterations+"] iterations")

AccountManagement = {}

AccountManagement.login = function(email, password, callback) {

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

    } else if(account) {

      AccountManagement.verifyPassword(password, account.password, function(authenticationSuccess) {
        if(authenticationSuccess) {
          logger.info("["+email+"] authentication success")
          callback(undefined, AccountManagement.filterAccount(account))
        } else {
          logger.warn("["+email+"] authentication failure")
          callback(new Error("Wrong password"), undefined)
        }
      })

    } else {
      logger.info("["+email+"] creating new account")
      // TODO: create account only if configuration says it's ok.
      AccountManagement.generateSaltedHash(password, function(err, hashedPasswordObject) {
        if(err) {
          logger.error(err)
          callback(err, undefined)
        } else {

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

          if(ConfMgr.readConf('encryption.enabled')) {
            imap = Security.encrypt(password, imap)
            smtp = Security.encrypt(password, smtp)
          }

          var account = {
            email: email,
            password: hashedPasswordObject,
            imap: imap,
            smtp: smtp
          }

          // TODO: autodiscover account's settings

          DBHelper.Account.save(account, function(err, savedAccount) {
            if(err) {
              logger.error(err)
              callback(err, undefined)
            } else {
              logger.info("["+email+"] new account created")
              savedAccount.configured = false
              callback(undefined, AccountManagement.filterAccount(savedAccount))
            }

          })
        }
      })
    }
  })
}

AccountManagement.filterAccount = function(account, password) {
  var filtered = {
    email: account.email,
    configured: account.configured,
    imap: account.imap,
    smtp: account.smtp
  }

  if(ConfMgr.readConf('encryption.enabled')) {
    filtered.imap = Security.decrypt(password, account.imap)
    filtered.smtp = Security.decrypt(password, account.smtp)
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

      if(ConfMgr.readConf('encryption.enabled')) {
        account.imap = Security.encrypt(password, account.imap)
        account.smtp = Security.encrypt(password, account.smtp)
      }

      if(settings.oldPassword || settings.newPassword) {

        setNewPassword(account, settings.oldPassword, settings.newPassword, function(err) {

          if(err) {

            callback(err)

          } else {

            DBHelper.Account.save(account, function(err, savedAccount) {
              callback(err, AccountManagement.filterAccount(savedAccount))
            })
          }
        })

      } else {

        DBHelper.Account.save(account, function(err, savedAccount) {
          callback(err, AccountManagement.filterAccount(savedAccount))
        })
      }
    }
  })
}

/** modifies the account object with a new password if the old one matches.
 *
 * @param account
 * @param oldPassword
 * @param newPassword
 * @param callback(err) err if something went wrong or if old password does not match
 */
function setNewPassword(account, oldPassword, newPassword, callback) {

  logger.info('['+account.email+'] attempt to set new password')

  AccountManagement.verifyPassword(oldPassword, account.password, function(match) {

    if(match) {
      AccountManagement.generateSaltedHash(newPassword, function(err, hashedPassword) {
        if(err) {
          callback(err)
        } else {
          account.password = hashedPassword
          callback()
        }
      })
    } else {
      logger.warn('['+account.email+'] attempt to set new password failed because the old password does not match')
      callback(new FieldError(FieldError.TYPES.INVALID, 'oldPassword', 'It does not match the existing password.'))
    }

  })
}

AccountManagement.generateSaltedHash = function(plainText, callback) {
  var keylen = 512;

  if(typeof plainText == 'undefined') {
    plainText = ''
  }

  crypto.randomBytes(keylen, function(err, salt) {
    if (err) {
      logger.error(err)
      callback(err, undefined)
    } else {
      var iterations = 1
      hash(plainText, salt, iterations, keylen, function(err, hash) {
        if(err) {
          logger.error(err)
          callback(err, undefined)
        } else {

          var password = {
            salt: salt.toString('hex'),
            keylen: keylen,
            iterations: iterations,
            hash: hash.toString('hex')
          }
          callback(undefined, password);
        }
      })
    }
  })
}

AccountManagement.verifyPassword = function(plainText, password, callback) {

  if(typeof plainText == 'undefined') {
    plainText = ''
  }

  hash(plainText, new Buffer(password.salt, 'hex'), password.iterations, password.keylen, function(err, hash) {
    if(err) {
      logger.error(err)
      callback(false)
    } else {
      callback(hash.toString('hex') === password.hash)
    }
  })
}

AccountManagement.looksLikeAnEmail = function(email) {
  return /.+@.+/.test(email)
}

function hash(plainText, salt, iterations, keylen, callback) {

  var startTime = Date.now()

  if(iterations < hashIterations) {
    logger.warn('Password hashing uses too few iterations. A high number of iterations ensure it is hard to brutefore a password. A number of at least ['+hashIterations+']')
  }

  crypto.pbkdf2(plainText, salt, iterations, keylen, function(err, hash) {

    var hashTime = Date.now() - startTime

    if(!err && hashTime > 500) {
      logger.warn("Hash time took too long ("+hashTime+"ms). This directly impacts the application performance, scalability and the end user login time.")
    }

    callback(err, hash)
  })
}

module.exports = AccountManagement;