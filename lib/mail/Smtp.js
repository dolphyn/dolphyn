var nodemailer  = require("nodemailer")
var logger      = require('./../util/Logger.js')
var crypto      = require('crypto')

function Smtp(account) {

  var self = this

  var transportConfig = {
    host: account.smtp.host,
    port: account.smtp.port,
    secureConnection: account.smtp.secure,
    auth: {
      pass: account.smtp.password,
      user: account.smtp.username
    },
    debug: true
  }

  console.log(JSON.stringify(transportConfig))

  var transport = nodemailer.createTransport("SMTP", transportConfig)

  this.sendMail = function(recipients, subject, html) {

    var mailOptions = {
      from: account.email,
      to: recipients.join(','),
      subject: subject,
      html: html
    }

    transport.sendMail(mailOptions, function(error, response) {
      if(error) {
        logger.error(error);
      } else {
        logger.info('message sent')
      }
    })
  }

}

var smtpInstances = {}

function getSMTPHandle(account) {

  var shasum = crypto.createHash('sha512')
  shasum.update(account.smtp.username + account.smtp.password + account.smtp.host + account.smtp.port)
  var hash = shasum.digest('hex')

  if(smtpInstances.hasOwnProperty(hash)) {
    logger.info('Matched configuration with an existing one. Returning existing SMTP instance')
  } else {
    logger.info('Could not match configuration with an existing one. Creating a new connection')
    smtpInstances[hash] = new Smtp(account)
  }

  return smtpInstances[hash]
}

module.exports = getSMTPHandle