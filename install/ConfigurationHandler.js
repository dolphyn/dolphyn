
var SerialRunner = require('serial').SerialRunner

/**
 *
 * @param options
 * @constructor
 */
function ConfigurationHandler(options, IOHelper, callback) {

  configure(options, IOHelper, callback)
}

function configure(options, IOHelper, callback) {

  if(options.title) {

    IOHelper.print('\n')
    IOHelper.print('\n')

    IOHelper.println(options.title)
    for(var i = 0 ; i < options.title.length ; i++) {
      IOHelper.print('=')
    }
    IOHelper.print('\n')
  }

  var configResult = options.default || {}

  var r = new SerialRunner()

  for(var i = 0 ; i < options.entries.length ; i++) {
    r.add(handleExpectedConfig, options.entries[i])
  }

  r.run(function() {
    if(options.confirm) {
      confirm(configResult, options, function(isConfirmed) {
        if(isConfirmed) {
          callback(configResult)
        } else {
          configure(options, IOHelper, callback)
        }
      })
    } else {
      callback(configResult)
    }
  })

  function handleExpectedConfig(config, callback) {
    switch(config.dataType) {
      case 'string':
        IOHelper.readString(config.message, configResult[config.attr], function(result) {
          configResult[config.attr] = result
          callback()
        })
        break
      case 'int':
        IOHelper.readInt(config.message, configResult[config.attr], function(result) {
          configResult[config.attr] = result
          callback()
        })
        break
      case 'boolean':
        IOHelper.readBoolean(config.message, configResult[config.attr], function(result) {
          configResult[config.attr] = result
          callback()
        })
        break
      default:
        throw new Error('Unsupported dataType in config '+JSON.stringify(config))
        break
    }
  }

  function confirm(config, options, callback) {

    var confirmationMessage = '\n\n'
    for(var i = 0 ; i < options.entries.length ; i++) {
      var entry = options.entries[i]
      confirmationMessage += '  '+entry.attr+': ' + config[entry.attr] + '\n'
    }
    confirmationMessage += '\n'
    confirmationMessage += '> Is the above configuration ok ?'

    IOHelper.readBoolean(confirmationMessage, 'y', function(isConfirmed) {
      callback(isConfirmed)
    })
  }
}

module.exports = ConfigurationHandler