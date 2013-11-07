
var crypto            = require('crypto')
var logger            = require('../../util/Logger.js')
var FieldError        = require('../../error/Errors.js').FieldError

var ConfMgr         = require("../../../install/ConfigurationManager.js")

var hashIterations = ConfMgr.readConf('application.hashAlgorithmIterations') || 20000

logger.info("The password hashing algorithm will use ["+hashIterations+"] iterations")

/**
 *
 * @param credentials
 * @param account
 * @param callback(err, sessionData)
 */
function auth(credentials, account, callback) {

  if(account.password) {

    verifyPassword(credentials.password, account.password, function(authenticationSuccess) {
      if(authenticationSuccess) {
        logger.info("["+account.email+"] authentication success")
        callback(undefined, undefined)
      } else {
        logger.warn("["+account.email+"] authentication failure")
        // TODO: field error
        callback(new Error("Wrong password"), undefined)
      }
    })

  } else {

    generateSaltedHash(credentials.password, function(err, hashedPasswordObject) {
      if(err) {
        logger.error(err)
        callback(err, undefined)
      } else {
        account.password = hashedPasswordObject;
        callback(undefined, undefined)
      }
    })

  }
}
/** modifies the account object with a new password if the old one matches.
 *
 * @param account
 * @param oldPassword
 * @param newPassword
 * @param callback(err) err if something went wrong or if old password does not match
 */
function update(oldCredentials, newCredentials, account, sessionData, callback) {

  if(!newCredentials.password) {
    return callback(undefined)
  }

  logger.info('['+account.email+'] attempt to set new password')

  verifyPassword(oldCredentials.password, account.password, function(match) {

    if(match) {
      generateSaltedHash(newCredentials.password, function(err, hashedPassword) {
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

function generateSaltedHash(plainText, callback) {
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

function verifyPassword(plainText, password, callback) {

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

module.exports = {
  auth: auth,
  update: update,
  verifyPassword: verifyPassword
}