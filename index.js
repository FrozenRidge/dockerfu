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

var findHttpPorts = module.exports.findHttpPorts = function(ports) {

  var webPorts = config.webPorts.split(',')

  for (var i = 0; i < ports.length; i++) {
    var p = ports[i]
    var privPort = p.PrivatePort.toString()
    if (p.PublicPort !== 0 && webPorts.indexOf(privPort) !== -1) return p.PublicPort
  }

  return false
}

var parsePrefixMaps = module.exports.parsePrefixMaps = function(config) {

  var maps = []
  config.prefixMaps.split(",").forEach(function(map) {
    maps.push(map.split(":"))
  })

  return maps
}

function containerList(redis, err, res) {

  var f = []

  var createRoute = function(k, c){
    var port = findHttpPorts(c.Ports)
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

  var prefixMaps = parsePrefixMaps(config)

  res.forEach(function(c) {

    var img = c.Image.split('/')
    // ignore if doesn't match our format
    if (img.length !== 2) return

    var found = false
    var idx
    for (idx = 0; idx < prefixMaps.length; idx++) {
      if (prefixMaps[idx][0] === img[0]) {
        found = true
        break
      }
    }

    if (!found) return

    var domain = prefixMaps[idx][0]
    var subdomain = prefixMaps[idx][1]
    createRoute(subdomain + '.' + domain, c)
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

var connectDocker = function(config) {
  var dockerSocketPath = config.dockerSocketPath
  var dockerHost = config.dockerHost
  var dockerPort = config.dockerPort
  var opts = {}
  if (dockerHost) {
    opts.host = dockerHost
    // default port
    opts.port = 4243
  }
  if (dockerPort) {
    opts.port = dockerPort
  }
  // if dockerHost is set, use that. otherwise UNIX domain socket.
  if (dockerSocketPath && !dockerHost) {
    opts.socketPath = dockerSocketPath
  }
  console.log("docker connection opts: ", opts)
  return new docker(opts)
}

var connectRedis = function(config) {
  return redis.createClient(parseInt(10,config.redisPort), config.redisHost)
}

config = rc('dockerfu', DEFAULT_CONFIG)
// for testing
module.exports.config = config

var sync = module.exports.sync = function(redis, docker, cb) {
  docker.listContainers(function(err, res) { containerList(redis, err, res)})
}

var show = module.exports.show = function(redis, docker, cb) {


}

if (!module.parent) {

  if (argv._.length < 1) {
    usage()
  }

  if (!argv._[0] in ['sync', 'show']) {
    usage()
  }

  var d = connectDocker(config)
  var r = connectRedis(config)

  var operations = []
  argv._.forEach(function(op) {
    if (op === 'sync') {
      return operations.push(function(cb) {
        sync(r, d, function(err) {
          cb()
        })
      })
    }
    if (op === 'show') {
      return operations.push(function(cb) {
        show(r, d, function(err) {
          cb()
        })
      })
    }
  })
  
  async.series(operations, function(err) {
    console.log("finished")
    r.quit()
  })

}
