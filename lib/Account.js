var FieldError = require("./error/Errors.js").FieldError
var ClientError = require("./error/Errors.js").ClientError

var DBHelper = require("./database/DBHelper")
var uuid = require("uuid")

function Account() {}

Account.create = function(imapConfig, callback) {

  var validationErrors = []

  imapConfig.uid = uuid.v4()

  if(!imapConfig.owner) {
    validationErrors.push(new FieldError(FieldError.TYPES.MISSING, "owner"))
  }

  if(!imapConfig.user) {
    validationErrors.push(new FieldError(FieldError.TYPES.MISSING, "user"))
  }

  if(!imapConfig.host) {
    validationErrors.push(new FieldError(FieldError.TYPES.MISSING, "host"))
  }

  if(!imapConfig.port) {
    validationErrors.push(new FieldError(FieldError.TYPES.MISSING, "port"))
  }

  if(validationErrors.length > 0) {
    var error = new ClientError(ClientError.TYPES.BAD_REQUEST)
    error.validations = validationErrors
    setImmediate(function() {
      callback(error)
    })
    return
  }

  // TODO: test configuration

  DBHelper.Account.save(imapConfig, function(err, savedConfig) {
    if(err) {
      callback(err)
    } else {
      callback()
    }
  })

}

Account.retrieveMail = function(accountUid, callback) {
  DBHelper.Account.findByKey(accountUid, function(err, account) {
    new Imap(account);
  })
}

module.exports = Account