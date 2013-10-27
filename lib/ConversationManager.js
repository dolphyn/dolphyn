
function ConversationManager() {

}

/*
  Fetch conversations
*/
ConversationManager.prototype.fetchAll = function(imapClient, callback) {

  var imapClient = new Imap()
  imapClient.openBox('INBOX', function(err, box) {
    if(err) throw err

    imapClient.fetchFull(1, 10, function(err, messages) {

    })
  })


}

ConversationManager.prototype.add = function(message, callback) {

}