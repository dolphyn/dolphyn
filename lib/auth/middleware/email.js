// set the email in the session

/**
 *
 * @param credentials
 * @param account
 * @param callback(err, sessionData)
 */
function auth(credentials, account, callback) {

  callback(undefined, account.email)

}

module.exports = {
  auth: auth
}