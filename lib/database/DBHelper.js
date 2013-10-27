
var _               = require("underscore")
var DB              = require("./DB.js").DB
var DBReady         = require("./DB.js").Event
var EventEmitter    = require('events').EventEmitter
var logger          = require("../util/Logger.js")

var DBHelper = {}

DBReady.on('ready', function(){
  module.exports.Event.emit('ready')
})

function Helper(collectionName, keyName) {

  this.findOne = function(query, options, callback) {

    DB.findOne(collectionName, query, options, callback)

  }

  this.findByKey = function(key, options, callback) {

    var query = {}
    query[keyName] = key

    DB.findOne(collectionName, query, options, callback)
  }

  this.find = function(query, fields_or_options, options_or_callback, callback) {

    DB.find(collectionName, query, fields_or_options, options_or_callback, callback)

  }

  this.count = function(query, optsOrCallback, callback) {
    DB.count(collectionName, query, optsOrCallback, callback)
  }

  this.update = function(query, obj, options, callback) {

    DB.update(collectionName, query, obj, options, callback)

  }

  this.save = function(obj, callback) {

    if(obj._id) {

      DB.update(collectionName, {"_id":obj._id}, obj, {safe: true}, callback)

    } else if(_.isArray(obj)) {

      var callbackCount = obj.length

      console.log("It's an array of length ["+callbackCount+"]")

      var error
      var results = []

      var doneCallback = function(err, result) {

        callbackCount --
        console.log(callbackCount)

        if(err) {
          logger.error(err)
          error = new Error("Multiple errors while saving objects")
        }

        if(result) {
          results.push(result)
        }

        if(callbackCount === 0) {
          callback(error, result)
        }

      }

      for(var i = 0 ; i < obj.length ; i++) {

        if(obj[i] && obj[i]._id) {
          DB.update(collectionName, {"_id": obj[i]._id}, obj[i], {safe: true}, function(err, result) {
            doneCallback(err, result)
          })
        } else {
          DB.save(collectionName, obj[i], function(err, result) {
            doneCallback(err, result)
          })
        }

      }

    } else {

      DB.save(collectionName, obj, callback)

    }
  }

  this.findAndModify = function(query, sortOrder, update, options, callback) {
    DB.findAndModify(collectionName, query, sortOrder, update, options, callback)
  }

  this.remove = function(selector, option_or_callback, callback) {
    DB.remove(collectionName, selector, option_or_callback, callback)
  }
}

DBHelper.Account = new Helper("accounts", "email")
DBHelper.Config = new Helper("configurations", "key")


module.exports = {
  DBHelper: DBHelper,
  Event: new EventEmitter()
}
