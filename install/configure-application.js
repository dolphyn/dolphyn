
var ConfMgr     = require('./ConfigurationManager.js')
var ConfHandler = require('./ConfigurationHandler.js')

function configure(IOHelper, callback) {

  var conf = ConfMgr.readConf()

  var appConfig = {
    allowAccountCreation: false,
    hashAlgorithmIterations: 50000,
    port: 3000,
    resetPasswordTimeout: (24 * 3600 * 1000) // 24hrs
  }

  if(conf.application) {
    if(conf.application.allowAccountCreation) {
      appConfig.allowAccountCreation = conf.application.allowAccountCreation
    }
    if(conf.application.hashAlgorithmIterations) {
      appConfig.hashAlgorithmIterations = conf.application.hashAlgorithmIterations
    }
  }

  var opts = {
    title: "Application Configuration",
    default: appConfig,
    confirm: true,
    entries: [
      {dataType: 'int', attr: 'port', message: 'HTTP port'},
      {dataType: 'boolean', attr: 'allowAccountCreation', message: 'Allow creation of new accounts'},
      {dataType: 'int', attr: 'hashAlgorithmIterations', message: 'Hash algorithm iterations'},
      {dataType: 'int', attr: 'resetPasswordTimeout', message: 'Timeout for password reset validation (ms)'}
    ]
  }

  new ConfHandler(opts, IOHelper, function(appConfig) {
    ConfMgr.mergeConf({application: appConfig})

    callback()
  })

}

module.exports = {
  configure: configure
}