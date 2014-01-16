Dockerfu
========

[![Build Status](https://frozenridge.stridercd.com/frozenridge/dockerfu/badge)](https://frozenridge.stridercd.com/frozenridge/dockerfu/)

![Dockerfu image](http://farm6.staticflickr.com/5485/10700976604_0aa7f937aa.jpg)

Glue between [Docker](http://docker.io) and [Hipache](https://github.com/dotcloud/hipache). Techniques to do Docker HTTP routing, zero-downtime updates of Docker containers, etc.

Docker Routing with Dockerfu
============================

Dockerfu provides a way to dynamically route HTTP URLs to particular Docker containers. To do this, it uses [Hipache](https://github.com/dotcloud/hipache) and two conventions:

### Prefix Maps

Prefix Maps are the convention that routable Docker images will be named *prefix*/*suffix* (e.g. frozenridge/www). *prefix* maps to a domain (e.g. frozenridge.co) and *suffix* maps to a subdomain (e.g. www). These Prefix Maps are configurable. 

At [FrozenRidge](http://frozenridge.co), we use Docker for everything and therefore have a large number of containers which map to various subdomains off `frozenridge.co`.

Hence we use the Prefix Map `frozenridge:frozenridge.co.

#### blog.frozenridge.co example

Our blog (http://blog.frozenridge.co) is a Docker image named `frozenridge/blog`.
With the Prefix Map `frozenridge:frozenridge.co`, Dockerfu will create Hipache routes for http://blog.frozenridge.co to the public web port of the running `frozenridge/blog` Docker container.

#### frozenridge.co example

Our marketing homepage (http://frozenridge.co and http://www.frozenridge.co) is a Docker image named `frozenridge/web`. 
`web` and `www` suffixes are treated specially, such that Dockerfu will create Hipache routes for *both* http://www.frozenridge.co *and* http://frozenridge.co to the public web port of the running `frozenridge/web` Docker container.

Prefix Maps can be specified with the `--prefixMaps` CLI option. E.g. `dockerfu --prefixMaps="frozenridge:frozenridge.co,stridercd:stridercd.com"`. Note that multiple maps can be specified comma-separated. Additionally, since dockerfu uses rc, these can be stored in a configuration file and loaded via `--config` CLI option.


### Exception Maps

Sometimes you just want to route an arbitrary Docker image to an arbitrary URL, without a convention. Exception maps enable you to do this. Say you want to map `frozenridge/gitbackups` to the URL http://gitbackups.com. This is easy with the exception map "frozenridge/gitbackups:gitbackups.com".

Exception Maps can be specified with the `--exceptionMaps` CLI option. E.g. `dockerfu --exceptionMaps="frozenridge/gitbackups:gitbackups.com"`. Note that multiple maps can be specified comma-separated. Additionally, since dockerfu uses rc, these can be stored in a configuration file and loaded via `--config` CLI option.

Zero-Downtime Updates with Dockerfu
===================================

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

Dockerfu is a simple CLI program which talks to redis (to configure Hipache) and dockerd. It has two modes: `sync` and `show`. `sync` writes to redis, while `show` simply displays configured routes.

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

Sample `dockerfu show` run:

```bash
 $ dockerfu show
┌───────────────────────────────┬────────────────────────┬───────────────┐
│ Route                         │ Forward                │ Container     │
├───────────────────────────────┼────────────────────────┼───────────────┤
│ frontend:stridercd.com        │ http://127.0.0.1:49158 │ Up 5 weeks    │
│ frontend:blog.frozenridge.co  │ http://127.0.0.1:49198 │ Up 28 minutes │
│ frontend:www.frozenridge.co   │ http://127.0.0.1:49154 │ Up 5 weeks    │
│ frontend:www.stridercd.com    │ http://127.0.0.1:49158 │ Up 5 weeks    │
│ frontend:hosted.stridercd.com │ http://127.0.0.1:49155 │ Up 5 weeks    │
│ frontend:gitbackups.com       │ http://127.0.0.1:49182 │ Up 3 weeks    │
│ frontend:web.frozenridge.co   │ http://127.0.0.1:49154 │ Up 5 weeks    │
│ frontend:media.stridercd.com  │ http://127.0.0.1:49153 │ Up 5 weeks    │
│ frontend:frozenridge.co       │ http://127.0.0.1:49154 │ Up 5 weeks    │
└───────────────────────────────┴────────────────────────┴───────────────┘
```

Sample `dockerfu sync` run:

```bash
$ dockerfu sync
mapped blog.frozenridge.co to http://127.0.0.1:49198
mapped gitbackups.com to http://127.0.0.1:49182
mapped hosted.stridercd.com to http://127.0.0.1:49155
mapped web.frozenridge.co to http://127.0.0.1:49154
mapped www.frozenridge.co to http://127.0.0.1:49154
mapped frozenridge.co to http://127.0.0.1:49154
mapped media.stridercd.com to http://127.0.0.1:49153
mapped www.stridercd.com to http://127.0.0.1:49158
mapped www.stridercd.com to http://127.0.0.1:49158
mapped stridercd.com to http://127.0.0.1:49158
hipache synced ok
```



Tests
=====

Dockerfu comes with tests. To run, simply execute `npm test`.

License
=======

Dockerfu is released under a BSD license.
