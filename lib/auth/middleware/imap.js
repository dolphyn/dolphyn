// set the imap object in the session

var _                 = require('underscore')
var logger            = require('../../util/Logger.js')
var Security          = require('../Security.js')

var ConfMgr         = require("../../../install/ConfigurationManager.js")

var encryptionEnabled = ConfMgr.readConf('encryption.enabled') || false

/**
 *
 * @param credentials
 * @param account
 * @param callback(err, sessionData)
 */
function auth(credentials, account, callback) {
  if(!account.imap) {
    logger.error('['+account.email+'] has no imap configuration')
    return callback(undefined, undefined)
  }

  var imap

  if(_.isString(account.imap)) {
    logger.error('['+account.email+'] decrypting imap configuration')
    imap = Security.decrypt(credentials.password, account.imap)
  } else {
    imap = account.imap;
  }

  if(encryptionEnabled) {
    logger.error('['+account.email+'] encrypting imap configuration')
    account.imap  = Security.encrypt(credentials.password, imap)
  } else {
    account.imap = imap
  }

  callback(undefined, imap)

}

/** modifies the account object with a new password if the old one matches.
 *
 * @param account
 * @param oldPassword
 * @param newPassword
 * @param callback(err) err if something went wrong or if old password does not match
 */
function update(oldCredentials, newCredentials, account, sessionData, callback) {

  callback(undefined)

}

module.exports = {
  auth: auth,
  update: update
}