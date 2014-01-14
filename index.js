#!/usr/bin/env node

// Default config
var DEFAULT_CONFIG = {
  redisPort: 6376,
  redisHost: '127.0.0.1',
  // By default, connect to local UNIX domain socket
  dockerSocketPath: '/var/run/docker.sock',
  // If dockerHost and dockerPort are set, will connect using TCP
  dockerHost: null,
  dockerPort: null,
  // Hipache backend. Defaults to 127.0.0.1
  hipacheBackend: 'http://127.0.0.1',
  // Ports which will be routed to in Hipache. Expected to be HTTP servers.
  webPorts: "8080,80,3000",
  // Prefix for webapp docker images. E.g. image frozenridge/foo -> http://foo.frozenridge.co
  // We assume that a container with suffix 'www' or 'web' maps to both root domain and www
  // e.g. frozenridge/web maps to http://frozenridge.co and http://www.frozenridge.co
  // stridercd/www maps to http://stridercd.com and http://www.stridercd.com
  prefixMaps: "frozenridge:frozenridge.co,stridercd:stridercd.com",
  // Special maps for FQDNs
  exceptionMaps: "frozenridge/gitbackups:gitbackups.com,frozenridge/gitbackups:www.gitbackups.com"
}

var argv   = require('optimist').argv
var async  = require('async')
var docker = require('dockerode')
var rc     = require('rc')
var redis  = require('redis')
var table  = require('cli-table')

var config

function findHttpPort(ports) {

  var webPorts = config.webPorts.split(',')

  for (var i = 0; i < ports.length; i++) {
    var p = ports[i]
    // TODO: use webPorts array
    if (p.PrivatePort === 8080 && p.PublicPort !== 0) return p.PublicPort
    if (p.PrivatePort === 3000 && p.PublicPort !== 0) return p.PublicPort
    if (p.PrivatePort === 80 && p.PublicPort !== 0)   return p.PublicPort
  }

  return false
}



function containerList(err, res) {

  var f = []

  var createRoute = function(k, c){
    // We look for port 80, 8080 and 3000 to forward. We assume these are HTTP.
    var port = findHttpPort(c.Ports)
    if (!port) {
      console.log("error: couldn't find valid public http port for container %s", c.Id)
      process.exit(1)
    }
    var backend = config.hipacheBackend + ':' + port
    f.push(function(cb) {
      redis.multi()
        .del('frontend:' + k)
        .rpush('frontend:' + k, k)
        .rpush('frontend:' + k, backend)
        .exec(function(err, res) {
          if (err) return cb(err)
          console.log("mapped %s to %s", k, backend)
          cb()
        })
    })

  }

  res.forEach(function(c) {
    if (c.Image.indexOf('frozenridge/blog') === 0){
      // Special case for blog TODO: Make nicer
      createRoute('blog.frozenridge.co', c)
      return;
    }

    if (c.Image.indexOf('frozenridge/web') === 0){
      // Special case for website TODO: Make nicer
      createRoute('www.frozenridge.co', c)
      createRoute('frozenridge.co', c)
      return;
    }

    if (c.Image.indexOf('frozenridge/gitbackups') === 0){
      // Special case for gitbackups website TODO: Make nicer
      createRoute('www.gitbackups.com', c)
      createRoute('gitbackups.com', c)
      return;
    }

    if (c.Image.indexOf('stridercd') === -1) return
    var s = c.Image.split('/')
    if (s.length !== 2) return
    s = s[1]
    s = s.split(':')[0]
    createRoute(s + '.stridercd.com', c);

    // Special case for naked stridercd.com to point to same backend as www.stridercd.com
    if (s === 'www') {
      var sk = 'stridercd.com'
      createRoute(sk, c);
    }
  })

  if (f.length === 0) {
    console.log("no running images found to sync. start some?")
    process.exit(0)
  }

  async.series(f, function(err, res) {
    if (err) {
      console.log("error syncing hipache: %s", err)
      process.exit(1)
    }

    console.log("hipache synced ok")
    redis.quit()
  })
}

function usage() {

  console.log("Usage: dockerfu [OPTIONS] <sync|show> <...>")
  var t = new table({ 
    head: ["option", "description"],
    chars: {'mid': '', 'left-mid': '', 'mid-mid': '', 'right-mid': ''},
  });
  t.push(['--config FILE', 'Load dockerfu config from FILE (see https://github.com/dominictarr/rc)'])
  t.push(['--dockerSocketPath PATH', 'Docker UNIX domain socket path [default: /var/run/docker.sock]'])
  t.push(['--dockerHost HOSTNAME', 'Docker TCP Host'])
  t.push(['--dockerPort PORT', 'Docker TCP Port'])
  t.push(['--exceptionMaps IMAGE:FQDN[,IMAGE:FQDN,...]', 'List of docker images -> FQDN map exceptions'])
  t.push(['--prefixMaps PREFIX:DOMAIN[,PREFIX:DOMAIN,...]', 'List of docker image prefix -> domain maps'])
  t.push(['--redisHost HOSTNAME', 'Redis hostname [default: localhost]'])
  t.push(['--redisPort PORT', 'Redis port [default: 6376]'])
  t.push(['--webPorts PORT[,PORT,...]', 'List of Web ports in containers [default: 80,8080,3000]'])
  console.log(t.toString())

  process.exit(1)
}

if (argv._.length < 1) {
  usage()
}

if (!argv._[0] in ['sync', 'show']) {
  usage()
}

config = rc('dockerfu', DEFAULT_CONFIG)

console.log("config: ", config)

argv._.forEach(function(op) {

})
