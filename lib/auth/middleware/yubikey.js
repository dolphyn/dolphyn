
var crypto            = require('crypto')
var logger            = require('../../util/Logger.js')
var FieldError        = require('../../error/Errors.js').FieldError

var yub = require('yub')


var ConfMgr         = require("../../../install/ConfigurationManager.js")

var clientId = ConfMgr.readConf('yubico.clientId') || ''
var secret   = ConfMgr.readConf('yubico.secret')   || ''
var offline  = ConfMgr.readConf('yubico.offline')  || ''

yub.init(clientId, secret)

/**
 *
 * @param credentials
 * @param account
 * @param callback(err, sessionData)
 */
function auth(credentials, account, callback) {

  authorize(credentials, account, function(err, data) {

    if(err) {

      callback(err, undefined)

    } else {

      if(!account.yubikeys || account.yubikeys.length === 0) {
        account.yubikeys = [data.identity]
      }

      callback(undefined, undefined)

    }
  })

}


function authorize(credentials, account, callback) {
  yub.verify(credentials.yubikeyOTP, function(err, data) {

    if(err) {

      logger.error("["+account.email+"] authentication error")
      logger.error(err)
      callback(err, undefined)

    } else if (data.signatureVerified && data.nonceVerified && data.status == "OK") {

      if(account.yubikeys && account.yubikeys.length > 0 && account.yubikeys.indexOf(data.identity) === -1) {
        callback(new Error('unauthorized'), undefined)
      } else {
        callback(undefined, data)
      }

    } else {

      callback(new Error('Invalid OTP'), undefined)

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
function update(oldCredentials, newCredentials, account, sessionData, callback) {

  authorize(oldCredentials.yubikeyOTP, account, function(err, data) {
    if(err) {
      logger.error("["+account.email+"] authentication error")
      logger.error(err)
      callback(err, undefined)
    } else {
      yub.verify(newCredentials.yubikeyOTP, function(err, data) {
        if(err) {
          callback(err, undefined)
        } else if (data.signatureVerified && data.nonceVerified && data.status == "OK") {
          account.yubikeys.push(data.identity)
          callback(undefined, undefined)
        } else {
          callback(new Error('The new OTP is invalid'), undefined)
        }
      })

    }
  })

}

function remove(credentials, account, callback) {

  authorize(credentials.yubikeyOTP, account, function(err, data) {
    if(err) {
      logger.error("["+account.email+"] authentication error")
      logger.error(err)
      callback(err, undefined)
    } else {
      if(credentials.remove && account.yubikeys && account.yubikeys.indexOf(credentials.remove) > -1) {
        account.yubikeys.splice(account.yubikeys.indexOf(credentials.remove), 1)
      }
      callback(undefined, undefined)
    }
  })
}


module.exports = {
  auth: auth,
  update: update,
  remove: remove
}