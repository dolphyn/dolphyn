// set the smtp object in the session

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
  if(!account.smtp) {
    logger.error('['+account.email+'] has no smtp configuration')
    return callback(undefined, undefined)
  }

  var smtp

  if(_.isString(account.smtp)) {
    logger.error('['+account.email+'] decrypting smtp configuration')
    smtp = Security.decrypt(credentials.password, account.smtp)
  } else {
    smtp = account.smtp;
  }

  if(encryptionEnabled) {
    logger.error('['+account.email+'] encrypting smtp configuration')
    account.smtp = Security.encrypt(credentials.password, smtp)
  } else {
    account.smtp = smtp
  }

  callback(undefined, smtp)

}

function update(oldCredentials, newCredentials, account, sessionData, callback) {

  // the auth code takes care of handling encryption if necessary
  auth(newCredentials, account, function(err, decryptedImap) {
    callback(err)
  })

}

module.exports = {
  auth: auth,
  update: update
}