
var ConfMgr     = require('./ConfigurationManager.js')
var ConfHandler = require('./ConfigurationHandler.js')

function configure(IOHelper, callback) {

  var conf = ConfMgr.readConf()

  var yubicoConfig = {
    enabled: false,
    offline: false,
    clientId: '',
    secret: ''
  }

  if(conf.yubico) {
    if(conf.yubico.enabled) {
      yubicoConfig.enabled = conf.yubico.enabled
    }
    if(conf.yubico.offline) {
      yubicoConfig.offline = conf.yubico.offline
    }
    if(conf.yubico.clientId) {
      yubicoConfig.clientId = conf.yubico.clientId
    }
    if(conf.yubico.secret) {
      yubicoConfig.secret = conf.yubico.secret
    }
  }

  var opts = {
    title: "Yubico",
    default: yubicoConfig,
    confirm: true,
    entries: [
      {dataType: 'boolean', attr: 'enabled', message: 'Enable YubiKey OTP authentication'},
      {dataType: 'boolean', attr: 'offline', message: 'Whether to use the offline mode'},
      {dataType: 'string', attr: 'clientId', message: 'Your Yubico API client id'},
      {dataType: 'string', attr: 'secret', message: 'Your Yubico API secret'}
    ]
  }

  new ConfHandler(opts, IOHelper, function(yubicoConfig) {
    ConfMgr.mergeConf({yubico: yubicoConfig})
    callback()
  })

}

module.exports = {
  configure: configure
}