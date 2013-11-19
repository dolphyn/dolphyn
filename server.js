var url                   = require('url')
var express               = require('express')
var app                   = express()
var connect               = require("connect")
var toobusy               = require("toobusy")
var optimist              = require("optimist")
var logger                = require('./lib/util/Logger.js')
var server                = require('http').createServer(app)
var SocketAPI             = require('./lib/mail/SocketAPI.js')
var io                    = require('socket.io').listen(server)
var HttpResponseAugmenter = require("./lib/error/HttpResponseAugmenter.js")

toobusy.maxLag(10);

var argv = optimist
  .usage('Usage: $0 --port [num]')
  .argv

var port = argv.port || process.env.DOLPHYN_PORT || 4200

server.listen(port, '::', function() {
  console.log("server listening to http://"+require("os").hostname() + ":"+port)
})

app.configure(function () {
  app.use(express.static(__dirname + '/public'))
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(HttpResponseAugmenter())
  app.use(app.router)
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

app.get("/*", function(req, res) {
    if(toobusy()) {
      res.send("The server is overloaded", 503);
    } else {
      res.sendfile(__dirname + "/public/index.html")
    }
})
//
//app.get("/configure", function(req, res) {
//  if(secure(req, res)) {
//    res.sendfile(__dirname + "/public/configure.html")
//  }
//})

io.set('log level', 1)
//
//io.set('authorization', function (handshakeData, accept) {
//
//  if (handshakeData.headers.cookie) {
//
//    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie)
//
//    if(!handshakeData.cookie[cookie_key]) {
//      return accept('Cookie is invalid.', false)
//    }
//
//    handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie[cookie_key], cookie_secret)
//
//    if (handshakeData.cookie[cookie_key] == handshakeData.sessionID) {
//      return accept('Cookie is invalid.', false)
//    }
//
//  } else {
//    return accept('No cookie transmitted.', false)
//  }
//
//  accept(null, true);
//})


//var SocketIoRedisStore = require('socket.io/lib/stores/redis'),
//    redis              = require('socket.io/node_modules/redis');
//
//io.set('store', new SocketIoRedisStore({
//  redisPub    : redis.createClient(),
//  redisSub    : redis.createClient(),
//  redisClient : redis.createClient()
//}));

process.on('SIGINT', function() {
  server.close();
  toobusy.shutdown();
  process.exit();
});

io.sockets.on('connection', function (socket) {

  SocketAPI.attach(socket)

})