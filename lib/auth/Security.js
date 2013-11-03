var crypto          = require('crypto')
var ConfMgr         = require("../../install/ConfigurationManager.js")
var logger          = require('../util/Logger.js')

var cypherAlgorithm = ConfMgr.readConf('encryption.cypher') || 'aes256'
var cypherPasswordPrefix = ConfMgr.readConf('encryption.passwordPrefix') || ''

function encrypt(password, object) {
  var cypher = crypto.createCipher(cypherAlgorithm, cypherPasswordPrefix + password)
  var encrypted = cypher.update(JSON.stringify(object), 'binary', 'hex') + cypher.final('hex')
  return encrypted
}

function decrypt(password, encrypted) {
  var cypher = crypto.createDecipher(cypherAlgorithm, cypherPasswordPrefix + password)
  var decrypted = cypher.update(encrypted, 'hex', 'binary') + cypher.final('binary')
  return JSON.parse(decrypted)
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
}