// handles password reset


var uuid              = require('uuid')
var crypto            = require('crypto')
var logger            = require('../../util/Logger.js')
var FieldError        = require('../../error/Errors.js').FieldError

var ConfMgr         = require("../../../install/ConfigurationManager.js")

var tokenTimeout = ConfMgr.readConf('application.resetPasswordTimeout') || (24 * 3600 * 1000) // 24hrs

/**
 *
 * @param credentials
 * @param account
 * @param callback(err, sessionData)
 */
function auth(credentials, account, callback) {

  if(!account.password && account.resetToken) {
    if(credentials.token && credentials.token === account.resetToken.hash) {
      if(account.resetToken.timestamp < (Date.now() - tokenTimeout)) {
        logger.warn('['+account.email+'] reset token timed out');
        callback(new Error('The reset token timed out'), undefined)
      } else {
        logger.info('['+account.email+'] reset token used');
        account.resetToken = undefined;
        callback(undefined, undefined)
      }

    } else if(credentials.token) {
      logger.warn('['+account.email+'] account disabled');
      callback(new Error('Reset token missing'), undefined);
    } else {
      logger.warn('['+account.email+'] wrong reset token');
      callback(new Error('Wrong reset token'), undefined);
    }

  } else {
    // pass as successful when no reset is needed
    callback(undefined, undefined)
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

  account.password = null
  account.resetToken = {
    hash: uuid.v4(),
    timestamp: Date.now()
  }

  callback(undefined)

}

module.exports = {
  auth: auth,
  update: update
}