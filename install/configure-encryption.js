
var ConfMgr     = require('./ConfigurationManager.js')
var ConfHandler = require('./ConfigurationHandler.js')

function configure(IOHelper, callback) {

  var conf = ConfMgr.readConf()

  var encryptionConfig = {
    enabled: false,
    cypher: 'aes256',
    passwordPrefix: ''
  }

  if(conf.encryption) {
    if(conf.encryption.enabled) {
      encryptionConfig.enabled = conf.encryption.enabled
    }
    if(conf.encryption.cypher) {
      encryptionConfig.cypher = conf.encryption.cypher
    }
    if(conf.encryption.passwordPrefix) {
      encryptionConfig.passwordPrefix = conf.encryption.passwordPrefix
    }
  }

  var opts = {
    title: "Encryption",
    default: encryptionConfig,
    confirm: true,
    entries: [
      {dataType: 'boolean', attr: 'enabled', message: 'Encrypt sensitive data in the database'},
      {dataType: 'string', attr: 'cypher', message: 'The cypher algorithm (default recommended)'},
      {dataType: 'string', attr: 'passwordPrefix', message: 'A prefix for each encryption password'},
    ]
  }

  new ConfHandler(opts, IOHelper, function(encryptionConfig) {
    ConfMgr.mergeConf({encryption: encryptionConfig})
    callback()
  })

}

module.exports = {
  configure: configure
}