var Security = require('../lib/auth/Security.js')

var assert = require('assert')

describe('Security', function() {

  it('encryption should make data unreadable', function () {

    var password = 'superSecurePassword'

    var encrypted = Security.encrypt(password, {foo: 'secret'})

    assert.equal(encrypted, '53bd10599a6e50f8218065a0123283b2') // AES256

  })

  it('encrypted data should be unencrypted correctly', function () {

    var password = 'superSecurePassword'

    var encrypted = Security.encrypt(password, {foo: 'bar'})

    var decrypted = Security.decrypt(password, encrypted)

    assert.deepEqual(decrypted, {foo: 'bar'})

  })

})