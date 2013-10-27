
var ConfMgr     = require('./ConfigurationManager.js')
var ConfHandler = require('./ConfigurationHandler.js')

function configure(IOHelper, callback) {

  var conf = ConfMgr.readConf()

  var mongoDBConfig = {
    host: 'localhost',
    port: 27017,
    name: 'dolphyn-mail',
    user: 'dolphyn-mail',
    password: ''
  }

  if(conf.database) {
    if(conf.database.host) {
      mongoDBConfig.host = conf.database.host
    }
    if(conf.database.port) {
      mongoDBConfig.port = conf.database.port
    }
    if(conf.database.name) {
      mongoDBConfig.name = conf.database.name
    }
    if(conf.database.user) {
      mongoDBConfig.user = conf.database.user
    }
    if(conf.database.password) {
      mongoDBConfig.password = conf.database.password
    }
  }

  var opts = {
    title: "MongoDB Configuration",
    default: mongoDBConfig,
    confirm: true,
    entries: [
      {dataType: 'string', attr: 'host', message: 'host'},
      {dataType: 'int', attr: 'port', message: 'port'},
      {dataType: 'string', attr: 'name', message: 'db name'},
      {dataType: 'string', attr: 'user', message: 'user'},
      {dataType: 'string', attr: 'password', message: 'password'},
    ]
  }

  new ConfHandler(opts, IOHelper, function(mongoDBConfig) {
    ConfMgr.mergeConf({database: mongoDBConfig})

    callback()
  })

}

module.exports = {
  configure: configure
}