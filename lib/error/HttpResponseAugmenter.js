
var Errors = require('./Errors.js')
var logger = require('../util/Logger.js')

var developmentMode = process.env.NODE_ENV !== 'production'

module.exports = function() {

  return function(req, res, next) {

    res.error = function(err, httpCode) {

      var errorResponse = {
        reason: err.message
      }

      if(developmentMode) errorResponse.stack = err.stack

      if(!httpCode && err instanceof Errors.ClientError) {
        httpCode = err.getType()
      } else if(!httpCode) {
        httpCode = 500
      }

      res.send(errorResponse, httpCode)
    }

    setImmediate(next)

  }

}