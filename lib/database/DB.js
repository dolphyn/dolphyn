var mongo           = require('mongodb')
var EventEmitter    = require('events').EventEmitter
var ParallelRunner  = require('serial').ParallelRunner
var logger          = require("../util/Logger.js")
var ConfMgr         = require("../../install/ConfigurationManager.js")

Provider = function(name, host, port, user, password, callback) {
  var self = this

  if(host && port) {
    this.db = new mongo.Db(name, new mongo.Server(host, port, {auto_reconnect : true, poolSize : 30}), {native_parser:false, safe: true})

    this.db.open(function(err) {

      if (err) {
        if(/^failed to connect/mi.test(err.message)) {
          logger.error(err)
          logger.error("It looks like MongoDB is down or cannot be accessed.")
          process.exit(1)
        } else {
          throw(err)
        }
      }

      self.db.authenticate(user, password, function(err, result) {

        if (err) {
          throw err
        }

        logger.info("authentication: "+result)
        callback()
      })
    })
  } else {
    logger.error("Mongodb host and port must be specified")
  }
  var collections = {}

  /**
   *
   * @param name the collection name
   * @param indexes any indexes to set on the collection. See doc on indexes here: (http://christkv.github.com/node-mongodb-native)
   */
  this.loadCollection = function(name, indexes, callback) {

    logger.info('Loading collection ['+name+']')

    self.db.collection(name, function(err, collection) {

      if (err) {
        throw err
      }

      collections[name] = collection
      logger.info('Collection ['+name+'] loaded')


      if(indexes) {
//                logger.debug(">> Creating indexes on collection ["+name+"]")

        for(var i = 0 ; i < indexes.length ; i++) {

          collection.ensureIndex(indexes[i].index, indexes[i].options, function(err, indexName) {

            if (err) {
              throw err
            }

            logger.debug("Created index [" + indexName + "] on collection ["+name+"]")

            if(callback) {
              callback()
            }
          })

        }
      }
    })
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param obj the object to insert or update
   * @param callback (err, obj)
   */
  this.update = function(collection, selector, document, optionsOrCallback, callback) {

    if(collections[collection]) {

      logger.debug(collection+".update("+JSON.stringify(selector)+", "+JSON.stringify(document)+", "+JSON.stringify(optionsOrCallback)+")")


      if(!callback) {

        callback = optionsOrCallback

        optionsOrCallback = {}

      }

      optionsOrCallback.safe = true

      collections[collection].update(selector, document, optionsOrCallback, function(err, savedDocument) {

        if(err) {
          return callback(err, undefined)
        }

        if(savedDocument === 1) {
          callback(undefined, document)
        } else {
          callback(undefined, savedDocument)
        }

      })

    } else {

      var err = new Error("No collection with name ["+collection+"]")

      if(callback) {
        callback(err, undefined)
      } else {
        optsOrCallback(err, undefined)
      }

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param obj the object to insert or update
   * @param callback (err, obj)
   */
  this.save = function(collection, document, callback) {

    if(collections[collection]) {

      logger.debug(collection+".save("+JSON.stringify(document)+", {safe: true})")


      collections[collection].save(document, {safe: true}, function(err, result) {

        if(err) {
          return callback(err, undefined)
        }

        if(result === 1) {
          callback(undefined, document)
        } else {
          callback(undefined, result)
        }

      })

    } else {

      var err = new Error("No collection with name ["+collection+"]")

      callback(err, undefined)

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param query the search query
   * @param options search options
   * @param callback (err, obj)
   */
  this.findOne = function(collection, query, optsOrCallback, callback) {

    if(collections[collection]) {

      if(callback) {

        logger.debug(collection+".findOne("+JSON.stringify(query)+", "+JSON.stringify(optsOrCallback)+")")

        collections[collection].findOne(query, optsOrCallback, callback)

      } else {

        logger.debug(collection+".findOne("+JSON.stringify(query)+")")

        collections[collection].findOne(query, optsOrCallback)

      }

    } else {

      var err = new Error("No collection with name ["+collection+"]")
      if(callback) {
        callback(err, undefined)
      } else {
        optsOrCallback(err, undefined)
      }

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param query the search query
   * @param options search options
   * @param callback (err, obj)
   */
  this.find = function(collection, query, fields_or_options_or_callback, options_or_callback, callback) {

    if(collections[collection]) {

      if(callback) {

        logger.debug(collection+".find("+JSON.stringify(query)+", "+JSON.stringify(fields_or_options_or_callback)+", "+JSON.stringify(options_or_callback)+")")

        collections[collection].find(query, fields_or_options_or_callback, options_or_callback).toArray(callback)

      } else if(options_or_callback) {

        logger.debug(collection+".find("+JSON.stringify(query)+")")

        collections[collection].find(query, fields_or_options_or_callback).toArray(options_or_callback)

      } else {

        logger.debug(collection+".find("+JSON.stringify(query)+")")

        collections[collection].find(query).toArray(fields_or_options_or_callback)

      }

    } else {

      var err = new Error("No collection with name ["+collection+"]")

      if(callback) {
        callback(err, undefined)
      } else if(options_or_callback) {
        options_or_callback(err, undefined)
      } else {
        fields_or_options_or_callback(err, undefined)
      }

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param query the search query
   * @param sortOrder order of the matches
   * @param update replacement object
   * @param optsOrCallback search options
   * @param callback (err, obj)
   */
  this.findAndModify = function(collection, query, sortOrder, update, optsOrCallback, callback) {

    if(collections[collection]) {

      if(callback) {

        logger.debug(collection+".findAndModify("+JSON.stringify(query)+", "+JSON.stringify(optsOrCallback)+")")

        collections[collection].findAndModify(query, sortOrder, update, optsOrCallback, callback)

      } else {

        logger.debug(collection+".findAndModify("+JSON.stringify(query)+")")

        collections[collection].findAndModify(query, sortOrder, update, optsOrCallback)

      }

    } else {

      var err = new Error("No collection with name ["+collection+"]")

      if(callback) {
        callback(err, undefined)
      } else {
        optsOrCallback(err, undefined)
      }

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param selector the search selector
   * @param optionsOrCallback search options
   * @param callback callback (err, obj)
   */
  this.remove = function(collection, selector, optionsOrCallback, callback) {
    if(collections[collection]) {
      if(callback) {
        logger.debug(collection+".remove("+JSON.stringify(selectoe)+","+JSON.stringify(optionsOrCallback)+")")
        collections[collection].remove(selector, optionsOrCallback, callback)
      } else {
        logger.debug(collection+".remove("+JSON.stringify(selector)+")")
        collections[collection].remove(selector, optionsOrCallback)
      }
    } else {
      var err = new Error("No collection with name ["+collection+"]")
      if(callback) {
        callback(err, undefined)
      } else {
        optionsOrCallback(err, undefined)
      }
    }
  }

  /** finds the distinct values for a specified field across a single collection.
   *
   * @param collection
   * @param key
   * @param query
   * @param optsOrCallback
   * @param callback
   */
  this.distinct = function(collection, key, query, optsOrCallback,callback){
    if(collections[collection]) {

      if(callback) {

        logger.debug(collection+".distinct("+JSON.stringify(key)+","+JSON.stringify(query)+", "+JSON.stringify(optsOrCallback)+")")

        collections[collection].distinct(key, query, optsOrCallback,callback)

      } else {

        logger.debug(collection+".distinct("+JSON.stringify(key)+","+JSON.stringify(query)+")")

        collections[collection].distinct(key, query, optsOrCallback)

      }

    } else {

      var err = new Error("No collection with name ["+collection+"]")

      if(callback) {
        callback(err, undefined)
      } else {
        optsOrCallback(err, undefined)
      }

    }
  }

  /**
   *
   * @param collection the collection name in which to save the object
   * @param query the search query
   * @param options search options
   * @param callback (err, obj)
   */
  this.count = function(collection, query, optsOrCallback, callback) {

    if(collections[collection]) {

      if(callback) {

        logger.debug(collection+".count("+JSON.stringify(query)+", "+JSON.stringify(optsOrCallback)+")")

        collections[collection].count(query, optsOrCallback, callback)

      } else {

        logger.debug(collection+".count("+JSON.stringify(query)+")")

        collections[collection].count(query, optsOrCallback)

      }

    } else {

      var err = new Error("No collection with name ["+collection+"]")
      if(callback) {
        callback(err, undefined)
      } else {
        optsOrCallback(err, undefined)
      }

    }
  }
}

var fileConf = ConfMgr.readConf()

var dbConf = {
  host      : process.env.DOLPHYN_DB_HOST || fileConf.database.host,
  port      : process.env.DOLPHYN_DB_PORT || fileConf.database.port,
  name      : process.env.DOLPHYN_DB_NAME || fileConf.database.name,
  user      : process.env.DOLPHYN_DB_USER || fileConf.database.user,
  password  : process.env.DOLPHYN_DB_PWD  || fileConf.database.password
}

logger.info("Connecting to DB with ["+dbConf.user + ":"+dbConf.password+"@" + dbConf.host+":"+dbConf.port+"/"+dbConf.name+"]")

var dbProvider = new Provider(
  dbConf.name,
  dbConf.host,
  Number(dbConf.port),
  dbConf.user,
  dbConf.password,
  function() {

    var runner = new ParallelRunner()

    runner.add(dbProvider.loadCollection, 'accounts', [
      { index: {email: 1}, options: {unique: true} }
    ])

    runner.add(dbProvider.loadCollection, 'configurations', [
      { index: {key: 1}, options: {unique: true} }
    ])

//        runner.add(dbProvider.loadCollection, 'messages', [
//            { index: {uid: 1}, options: {unique: true} },
//            { index: {subject: 1}, options: {unique: false} }
//        ])

    runner.run(function() {

      module.exports.Event.emit('ready')

    })

  })

module.exports = {
  DB:    dbProvider,
  Event: new EventEmitter()
}
