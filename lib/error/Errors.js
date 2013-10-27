var util = require('util')


//---------------------------------------//
//            ABSTRACT ERROR             //
//---------------------------------------//

var AbstractError = function (msg, constr) {
  Error.captureStackTrace(this, constr || this)
  this.message = msg || 'Error'
}
util.inherits(AbstractError, Error)
AbstractError.prototype.name = 'Abstract Error'

//---------------------------------------//
//             FIELD ERROR               //
//---------------------------------------//

var FieldError = function (type, field, details) {

  this.type = type
  this.field = field

  var msg
  switch(type) {
    case FieldError.TYPES.MISSING:
      msg = "Field ["+field+"] is required"
      break
    case FieldError.TYPES.WRONG_FORMAT:
      msg = "Field ["+field+"] is not formatted correctly. Expected format is ["+details+"]"
      break
    case FieldError.TYPES.INVALID:
      msg = "Field ["+field+"] is invalid. " + details
      break
    default:
      msg = type
      break
  }

  FieldError.super_.call(this, msg, this.constructor)
}
util.inherits(FieldError, AbstractError)
FieldError.prototype.message = 'Field Error'

FieldError.TYPES = {
  "MISSING"       : "MISSING",
  "WRONG_FORMAT"  : "WRONG_FORMAT",
  "INVALID"       : "INVALID"
}

FieldError.prototype.type = undefined; // this line does nothing but is here for documentation
FieldError.prototype.field = undefined; // this line does nothing but is here for documentation

//---------------------------------------//
//             CLIENT ERROR              //
//---------------------------------------//

// Used when a client sends a wrong request. Codes match HTTP 400 errors

var ClientError = function (type, msg) {

  this.getType = function() {
    return type;
  }

  ClientError.super_.call(this, msg, this.constructor)

}

util.inherits(ClientError, AbstractError)
ClientError.prototype.message = 'Client Error'

ClientError.TYPES = {
  "BAD_REQUEST"                     : 400,
  "UNAUTHORIZED"                    : 401,
  "PAYMENT_REQUIRED"                : 402,
  "FORBIDDEN"                       : 403,
  "NOT_FOUND"                       : 404,
  "METHOD_NOT_ALLOWED"              : 405,
  "NOT_ACCEPTABLE"                  : 406,
  "REQUEST_TIMEOUT"                 : 408,
  "CONFLICT"                        : 409,
  "GONE"                            : 410,
  "UNSUPPORTED_MEDIA_TYPE"          : 415,
  "REQUESTED_RANGE_NOT_SATISFIABLE" : 416,
  "EXPECTATION_FAILED"              : 417,
  "AUTHENTICATION_TIMEOUT"          : 419,
  "ENHANCE_YOUR_CALM"               : 420
}


module.exports = {
  FieldError: FieldError,
  ClientError: ClientError
}