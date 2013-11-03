var AuthProcedure   = require('../lib/auth/AuthProcedure.js')
var Security        = require('../lib/auth/Security.js')
var password        = require('../lib/auth/middleware/password.js')
var assert          = require('assert')


describe('Authentication procedure', function() {

  it('should create a password on new accounts', function (done) {

    var account = {
      email: 'foo@bar.com'
    }
    var credentials = { password: "foobar" }

    var auth = new AuthProcedure()

    auth.run(credentials, account, {}, function(err) {

      if(err) {
        done(err)
      } else {

        assert.ok(account.password)

        password.verifyPassword('foobar', account.password, function(match) {
          assert.ok(match)
          done()
        })

      }

    })

  })

  it('should decrypt encrypted account info', function(done) {
    var account = {
      email: 'foo@bar.com',
      imap: {
        host: 'bar.com'
      },
      smtp: {
        host: 'foo.com'
      }
    }
    var credentials = { password: "foobar" }

    var auth = new AuthProcedure()

    auth.run(credentials, account, {}, function(err) {

      if(err) {
        done(err)
      } else {

        assert.ok(account.imap)
        console.log(account.imap)
        assert.deepEqual(Security.decrypt('foobar', account.imap), { host: 'bar.com' })
        done()

      }

    })
  })

})