var nodemailer  = require("nodemailer")
var logger      = require('./../util/Logger.js')
var crypto      = require('crypto')

function Smtp(session) {

  var self = this

  var transportConfig = {
    host: session.smtp.host,
    port: session.smtp.port,
    secureConnection: session.smtp.secure,
    auth: {
      pass: session.smtp.password,
      user: session.smtp.username
    },
    debug: true
  }

  console.log(JSON.stringify(transportConfig))

  var transport = nodemailer.createTransport("SMTP", transportConfig)

  this.sendMail = function(recipients, subject, html) {

    var mailOptions = {
      from: session.email,
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

function getSMTPHandle(session) {

  var shasum = crypto.createHash('sha512')
  shasum.update(session.smtp.username + session.smtp.password + session.smtp.host + session.smtp.port)
  var hash = shasum.digest('hex')

  if(smtpInstances.hasOwnProperty(hash)) {
    logger.info('Matched configuration with an existing one. Returning existing SMTP instance')
  } else {
    logger.info('Could not match configuration with an existing one. Creating a new connection')
    smtpInstances[hash] = new Smtp(session)
  }

  return smtpInstances[hash]
}

module.exports = getSMTPHandle