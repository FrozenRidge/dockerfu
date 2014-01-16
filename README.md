Dockerfu
========

[![Build Status](https://frozenridge.stridercd.com/frozenridge/dockerfu/badge)](https://frozenridge.stridercd.com/frozenridge/dockerfu/)

![Dockerfu image](http://farm6.staticflickr.com/5485/10700976604_0aa7f937aa.jpg)

Glue between [Docker](http://docker.io) and [Hipache](https://github.com/dotcloud/hipache). Techniques to do Docker routing, zero-downtime updates of Docker containers etc.

Docker Routing with Dockerfu
============================

Dockerfu provides a way to dynamically route URLs to particular Docker containers. To do this, it uses two conventions:

### Prefix Maps

Prefix Maps are the convention that routable Docker images will be named *prefix*/*suffix* (e.g. frozenridge/www). *prefix* maps to a domain (e.g. frozenridge.co) and the suffix maps to a subdomain (e.g. www). These Prefix Maps are of course configurable. 

At FrozenRidge, we use Docker for everything and therefore have a large number of containers which map to various domains off `frozenridge.co` and `stridercd.com`.

For instance, our blog (http://blog.frozenridge.co) is a Docker image named `frozenridge/blog`. Our marketing homepage (http://frozenridge.co and http://www.frozenridge.co) is a Docker image named `frozenridge/web`. With the Prefix Map `frozenridge:frozenridge.co`, Dockerfu will create Hipache routes for http://blog.frozenridge.co to the public web port of the running `frozenridge/blog` Docker container. Furthermore, `web` and `www` suffixes are treated specially, such that Dockerfu will create Hipache routes for *both* http://www.frozenridge.co *and* http://frozenridge.co to the public web port of the running `frozenridge/web` Docker container.


### Exception Maps

Sometimes you just want to route an arbitrary Docker image to an arbitrary URL, without a convention. Exception maps let you do just this. Say you want to map `frozenridge/gitbackups` to the URL http://gitbackups.com. This is easy with the exception map "frozenridge/gitbackups:gitbackups.com".

Zero-Downtime Updates of Docker Containers with Dockerfu
========================================================

A zero-downtime update means:

- Start new container
- Wait for it to be ready
- Update router to send traffic to new container
- Kill old container

This is easy to do with shell, docker and dockerfu:

```bash

# get id of old (currently running) container
OLDID=$(docker ps | grep $CONTAINER_NAME | awk '{ print $1 }')

# build new container
# you could also pull the binary pre-build container instead of building
# this is just an example.
docker build -t $CONTAINER_NAME /path/to/Dockerfile

# start new container
docker run -d -p $WEB_PORT $CONTAINER_NAME

# update routing to send traffic to new container
dockerfu sync

# kill old container
docker kill $OLDID

```

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
