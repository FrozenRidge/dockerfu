Dockerfu
========

[![Build Status](https://frozenridge.stridercd.com/frozenridge/dockerfu/badge)](https://frozenridge.stridercd.com/frozenridge/dockerfu/)

![Dockerfu image](http://farm6.staticflickr.com/5485/10700976604_0aa7f937aa.jpg)

Glue between [Docker](http://docker.io) and [Hipache](https://github.com/dotcloud/hipache). Techniques to do zero-downtime updates of Docker containers etc.

Installation
============

Dockerfu is available in NPM. `npm install dockerfu`

Usage
=====

```
Usage: dockerfu [OPTIONS] <sync|show> <...>
┌────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ option                                         │ description                                                            │
│ --config FILE                                  │ Load dockerfu config from FILE (see https://github.com/dominictarr/rc) │
│ --dockerSocketPath PATH                        │ Docker UNIX domain socket path [default: /var/run/docker.sock]         │
│ --dockerHost HOSTNAME                          │ Docker TCP Host                                                        │
│ --dockerPort PORT                              │ Docker TCP Port                                                        │
│ --exceptionMaps IMAGE:FQDN[,IMAGE:FQDN,...]    │ List of docker images -> FQDN map exceptions                           │
│ --prefixMaps PREFIX:DOMAIN[,PREFIX:DOMAIN,...] │ List of docker image prefix -> domain maps                             │
│ --redisHost HOSTNAME                           │ Redis hostname [default: localhost]                                    │
│ --redisPort PORT                               │ Redis port [default: 6376]                                             │
│ --webPorts PORT[,PORT,...]                     │ List of Web ports in containers [default: 80,8080,3000]                │
└────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```



Tests
=====

Dockerfu comes with tests. To run, simply execute `npm test`.

License
=======

Dockerfu is released under a BSD license.
