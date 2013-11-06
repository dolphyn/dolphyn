var fs = require('fs')
var express = require('express')
var app = express()

app.use(express.cookieParser())
app.use(express.bodyParser())
app.use(express.static(__dirname + '/public', { maxAge: (24 * 3600 * 1000) }))


app.post('/register', function(req, res) {
  console.log(req.ip)
  // respond as fast as possible.
  res.redirect('/registered.html')

  // TODO: x-forwarded-for could be used by a bot to not be banned :/

  if(req.body && req.body.email) {
    register(req.ip, req.body.email)
  }

})

var port = 4202

app.listen(port, function() {
  console.log('Listening on port '+port)
})

function register(ip, email) {
  console.log(ip + ":" + email)
  countIP(ip)
  if(!isBanned(ip)) {
    fs.appendFile('subscriptions.txt', email+'\n', {flag: 'a'}, function(err) {
      if(err) console.log(err)
    })
  }
}

var requestsCountPerIp = {}
function countIP(ip) {
  if(!requestsCountPerIp[ip]) {
    requestsCountPerIp[ip] = 1
  } else {
    requestsCountPerIp[ip] ++
  }

  // we ban ips that register more than 200 emails
  if(requestsCountPerIp[ip] > 200) {
    ban(ip)
  } else if(requestsCountPerIp[ip] > 1000) {
    delete requestsCountPerIp[ip]
    eternalBan(ip)
  }
}


var bannedIPs = {
  lastReset: Date.now()
}

var eternallyBannedIPs = {}

function ban(ip) {
  console.log('banned ip '+ ip)
  bannedIPs[ip] = true
}

function isBanned(ip) {
  return (bannedIPs.hasOwnProperty(ip) || eternallyBannedIPs.hasOwnProperty(ip))
}

function eternalBan(ip) {
  console.log('eternally banned ip '+ ip)
  eternallyBannedIPs[ip] = true
}

var banPeriod = 24 * 3600 * 1000 // 24hrs

function tick() {
  if(bannedIPs.lastReset < (Date.now()-banPeriod)) {
    bannedIPs = {lastReset: Date.now()}
  }

  fs.writeFileSync('ban.json', JSON.stringify(bannedIPs));
  fs.writeFileSync('ban-eternal.json', JSON.stringify(eternallyBannedIPs));

  setTimeout(tick, 60*1000)
}

if(fs.existsSync('ban.json')) {
  bannedIPs = JSON.parse(fs.readFileSync('ban.json'))
}

if(fs.existsSync('ban-eternal.json')) {
  eternallyBannedIPs = JSON.parse(fs.readFileSync('ban-eternal.json'))
}

tick()
