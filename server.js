var url                   = require('url')
var cookie                = require("cookie")
var express               = require('express')
var app                   = express()
var connect               = require("connect")
var optimist              = require("optimist")
var logger                = require('./lib/util/Logger.js')
var server                = require('http').createServer(app)
var SocketAPI             = require('./lib/mail/SocketAPI.js')
var io                    = require('socket.io').listen(server)
var AccountManagement     = require("./lib/account/AccountManagement.js")
var HttpResponseAugmenter = require("./lib/error/HttpResponseAugmenter.js")
var SessionStore          = require('./node_modules/connect/lib/middleware/session/memory.js')

var cookie_key    = 'dolphyn-mail.sid'
var cookie_secret = 'This Is Not 2 Secure'
var sessionStore  = new SessionStore()

var argv = optimist
  .usage('Usage: $0 --port [num]')
  .argv

var port = argv.port || process.env.DOLPHYN_PORT || 4200

server.listen(port, function() {
  console.log("server listening to http://"+require("os").hostname() + ":"+port)
})

//app.use(express.logger())
app.configure(function () {
  app.use(express.static(__dirname + '/public'))
  app.use(express.cookieParser())
  app.use(express.session({secret: cookie_secret, key: cookie_key, store: sessionStore}))
  app.use(express.bodyParser())
  app.use(HttpResponseAugmenter())
//  app.use(app.router)
})


function secure(req, res) {
  if(!req.session || !req.session.account) {
    res.redirect('/login')
    return false
  } else {
    return true
  }
}

function configured(req, res) {
  if(req.session && req.session.account && req.session.account.configured) {
    return true
  } else {
    res.redirect('/configure')
    return false
  }
}

function redirect(req, res) {
  if(secure(req, res)) {
    if(configured(req, res)) {
      return false
    }
  }
  return true
}

app.get("/login", function(req, res) {
  if(req.session.account) {
    res.redirect("/");
  } else {
    res.sendfile(__dirname + "/public/login.html");
  }
})
app.get("/logout", function(req, res) {
  if(req.session) {
    req.session.destroy();
  }
  res.redirect('/login');
})

app.post("/login", function(req, res) {
  AccountManagement.login(req.body.email, req.body.password, function(err, account) {
    if(err) {
      res.error(err)
    } else {
      req.session.account = account
      if(account.configured) {
        res.redirect("/")
      } else {
        res.redirect("/configure")
      }
    }
  })
})

app.get("/", function(req, res) {
  if(!redirect(req, res)) {
    res.sendfile(__dirname + "/public/app.html")
  }
})

app.get("/configure", function(req, res) {
  if(secure(req, res)) {
    res.sendfile(__dirname + "/public/configure.html")
  }
})

io.set('log level', 1)

io.set('authorization', function (handshakeData, accept) {

  if (handshakeData.headers.cookie) {

    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)

    if(!handshakeData.cookie[cookie_key]) {
      return accept('Cookie is invalid.', false)
    }

    handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie[cookie_key], cookie_secret)

    if (handshakeData.cookie[cookie_key] == handshakeData.sessionID) {
      return accept('Cookie is invalid.', false)
    }

  } else {
    return accept('No cookie transmitted.', false)
  }

  accept(null, true);
})

io.sockets.on('connection', function (socket) {

  sessionStore.get(socket.handshake.sessionID, function(err, session) {
    if(err || !session || !session.account) {
      logger.info("Unauthorized Access")
      socket.emit(401) // unauthorized
      return;
    }
    SocketAPI.attach(socket, session)
  })

})