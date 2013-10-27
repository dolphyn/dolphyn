

var AccountManagement = require('../lib/account/AccountManagement.js')
var assert = require('assert')


describe('AccountManagement', function() {

  it('should correctly verify a hashed password', function (done) {
    var plainTextPwd = 'foo'
    AccountManagement.generateSaltedHash(plainTextPwd, function(err, hashedPassword) {
      if(err) throw err
      AccountManagement.verifyPassword(plainTextPwd, hashedPassword, function(match) {
        assert.ok(match)
        done()
      })

    })
  })

  it('should loosely validate emails', function() {
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar.com'))
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar'))
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar@foo'))
    assert.ok(!AccountManagement.looksLikeAnEmail('foobar.com'))
  })

})