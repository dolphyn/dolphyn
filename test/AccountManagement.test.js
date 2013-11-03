

var AccountManagement = require('../lib/account/AccountManagement.js')
var assert = require('assert')


describe('AccountManagement', function() {

  it('should loosely validate emails', function() {
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar.com'))
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar'))
    assert.ok(AccountManagement.looksLikeAnEmail('foo@bar@foo'))
    assert.ok(!AccountManagement.looksLikeAnEmail('foobar.com'))
  })

})