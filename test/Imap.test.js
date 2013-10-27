
var Imap    = require("../lib/mail/Imap.js")
var assert  = require("assert")

describe("Unit", function() {

  describe("Imap", function() {

    it("parseEmailAddress()", function() {

      assert.equal(Imap.parseEmailAddress('"Foo Bar" <foo@bar.com>').name, "Foo Bar")
      assert.equal(Imap.parseEmailAddress('Foo Bar <foo@bar.com>').name, "Foo Bar")
      assert.equal(Imap.parseEmailAddress('Foo Bar  <foo@bar.com>').name, "Foo Bar")

      assert.equal(Imap.parseEmailAddress('<foo@bar.com>').name, "foo@bar.com")
      assert.equal(Imap.parseEmailAddress('no sense').name, "no sense")

      assert.equal(Imap.parseEmailAddress('"Foo Bar" <foo@bar.com>').email, "foo@bar.com")
      assert.equal(Imap.parseEmailAddress('Foo Bar <foo@bar.com>').email, "foo@bar.com")
      assert.equal(Imap.parseEmailAddress('<foo@bar.com>').email, "foo@bar.com")
      assert.equal(Imap.parseEmailAddress('no sense').email, "no sense")

    })

    it("walkBoxes()", function(done) {
      var actualArray = []
      var expectedArray = ["INBOX","Work","[Gmail]","[Gmail]/All Mail","[Gmail]/Drafts","[Gmail]/Important","[Gmail]/Sent Mail","[Gmail]/Spam","[Gmail]/Starred","[Gmail]/Trash"]

      Imap.walkBoxes(boxesMockData, function(fullBoxName) {
        actualArray.push(fullBoxName)
        if(actualArray.length === expectedArray.length) {
          assert.deepEqual(actualArray, expectedArray)
          done()
        }
      })

    })

  })

})

var boxesMockData = {
  INBOX: { attribs: [], // mailbox attributes. An attribute of 'NOSELECT' indicates the mailbox cannot
    // be opened
    delimiter: '/', // hierarchy delimiter for accessing this mailbox's direct children.
    children: null, // an object containing another structure similar in format to this top level,
    // otherwise null if no children
    parent: null // pointer to parent mailbox, null if at the top level
  },
  Work:
  { attribs: [],
    delimiter: '/',
    children: null,
    parent: null
  },
  '[Gmail]': {
    attribs: [ '\\NOSELECT' ],
    delimiter: '/',
    children:
    {
      'All Mail': { attribs: [ '\\All' ],
      delimiter: '/',
      children: null
    },
      Drafts: {
        attribs: [ '\\Drafts' ],
        delimiter: '/',
        children: null
      },
      Important: {
        attribs: [ '\\Important' ],
        delimiter: '/',
        children: null
      },
      'Sent Mail': {
        attribs: [ '\\Sent' ],
        delimiter: '/',
        children: null
      },
      Spam: {
        attribs: [ '\\Junk' ],
        delimiter: '/',
        children: null
      },
      Starred: {
        attribs: [ '\\Flagged' ],
        delimiter: '/',
        children: null
      },
      Trash: {
        attribs: [ '\\Trash' ],
        delimiter: '/',
        children: null
      }
    },
    parent: null
  }
}