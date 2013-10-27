

var HttpResponseAugmenter = require('../lib/error/HttpResponseAugmenter.js')
var assert = require('assert')

var ClientError = require('../lib/error/Errors.js').ClientError


describe('HttpResponseAugmenter', function() {


  it('with a generic error', function (done) {

    var err = new Error('Error message is here')

    var res = mockResponse(function(responseObj, httpCode) {
      assert.equal(responseObj.reason, 'Error message is here')
      assert.ok(responseObj.stack)
      assert.equal(httpCode, 500)
      done()
    })

    HttpResponseAugmenter()(undefined, res, function() {

      res.error(err)
    })

  })

  it('with a client error', function (done) {

    var err = new ClientError(ClientError.TYPES.FORBIDDEN, 'forbidden')

    var res = mockResponse(function(responseObj, httpCode) {
      assert.ok(responseObj.reason)
      assert.equal(responseObj.reason, err.message)
      assert.ok(responseObj.stack)
      assert.equal(httpCode, ClientError.TYPES.FORBIDDEN)
      done()
    })

    HttpResponseAugmenter()(undefined, res, function() {

      res.error(err)

    })

  })

})

function mockResponse(callback) {
  var res = {
    send: callback
  }
  return res;
}