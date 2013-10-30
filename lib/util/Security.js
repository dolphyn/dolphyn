var crypto          = require('crypto')
var ConfMgr         = require("../../install/ConfigurationManager.js")

var cypherAlgorithm = ConfMgr.readConf('encryption.cypher') || 'aes256'
var cypherPasswordPrefix = ConfMgr.readConf('encryption.passwordPrefix') || ''

function encrypt(password, object) {
  var cypher = crypto.createCipher(cypherAlgorithm, cypherPasswordPrefix + password)
  cypher.update(JSON.stringify(object), 'binary')
  return cypher.final('hex')
}

function decrypt(password, encrypted) {
  var cypher = crypto.createDecipher(cypherAlgorithm, cypherPasswordPrefix + password)
  cypher.update(encrypted, 'hex')
  return JSON.parse(cypher.final('binary'))
}

module.exports = {
  encrypt: encrypt,
  decrypt: decrypt
}