
var IOHelper  = require('./IOHelper.js')
var DBConfig  = require('./configure-database.js')
var AppConfig = require('./configure-application.js')

DBConfig.configure(IOHelper, function() {
  AppConfig.configure(IOHelper, function() {

    IOHelper.println('\nDolphyn Mail is now configured and ready to run.')
    IOHelper.println('\n\t--> run `make start` to start dolphyn\n')
    IOHelper.close()
  })
})