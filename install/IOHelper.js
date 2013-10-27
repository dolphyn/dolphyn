

module.exports = {

  readInt: function(message, defaultValue, callback) {
    var self = this;

    printInputExpectations(message, defaultValue, undefined)

    read(function(str) {

      var i = defaultValue

      if(str && str.length > 0) {
        i = parseInt(str)
      }

      if(!isNaN(i)) {
        callback(i)
      } else {
        process.stdout.write('\nERROR: I was expecting an integer.\n')
        self.readInt(message, defaultValue, callback)
      }
    })
  },

  readString: function(message, defaultValue, callback) {

    printInputExpectations(message, defaultValue, undefined)

    read(function(str) {
      str = str.trim()
      str = str ? str : defaultValue
      callback(str)
    })
  },

  readBoolean: function(message, defaultValue, callback) {

    var self = this;
    if(defaultValue === false) {
      defaultValue = 'n'
    } else if(defaultValue === true) {
      defaultValue = 'y'
    }

    var possibilities = ['y','n']
    printInputExpectations(message, defaultValue, possibilities)

    read(function(str) {
      str = str.trim()
      str = str ? str : defaultValue

      switch(str) {
        case 'y':
        case 'yes':
          callback(true)
          break
        case 'n':
        case 'no':
          callback(false)
          break
        default:
          process.stdout.write('\nERROR: expecting one of ['+possibilities.join('/')+']')
          self.readBoolean(message, defaultValue, callback)
      }
    })
  },

  print: print,
  println: println,

  close: function() {
    process.stdin.end()
  }

}

function println(str) {
  process.stdout.write(str + '\n')
}

function print(str) {
  process.stdout.write(str)
}

function printInputExpectations(message, defaultValue, options) {
  print('- ' + message)
  if(options && options.length > 0) {
    print(' [')
    print(options.join('/'))
    print(']')
  }
  if(typeof defaultValue !== 'undefined') {
    print(' (' + defaultValue + ')')
  }
  print(': ')
}

function read(callback) {
  function listen(data) {
    process.stdin.removeListener('data', listen)
    callback(data.toString().replace('\n', ''))
  }

  process.stdin.on('data', listen)
}