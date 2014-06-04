###Spade
[![build status](https://secure.travis-ci.org/rootslab/spade.png?branch=master)](http://travis-ci.org/rootslab/spade) 
[![NPM version](https://badge.fury.io/js/spade.png)](http://badge.fury.io/js/spade)
[![build status](https://david-dm.org/rootslab/spade.png)](https://david-dm.org/rootslab/spade)

[![NPM](https://nodei.co/npm/spade.png?downloads=true&stars=true)](https://nodei.co/npm/spade/)

[![NPM](https://nodei.co/npm-dl/spade.png)](https://nodei.co/npm/spade/)

> ♠ _**Spade**_, a full-featured __Redis__ 2.x client, with __offline queue__ for commands, automatic __socket reconnection__ and __command rollback__ mechanism for __subscriptions__ and __incomplete transactions__.

> ♠ __Spade__ is a simple and clean modular client library, it makes use of:
 - __[Syllabus](https://github.com/rootslab/syllabus)__ module for __Redis__ commands/methods mix-ins.
 - __[Libra](https://github.com/rootslab/libra)__ module to handle bindings between sent commands and __Redis__ replies; it handles also __commands queue rollbacks__ with the help of __[Train](https://github.com/rootlsab/train)__ module.
 - __[Cocker](https://github.com/rootslab/cocker)__ to properly handle socket reconnection when the connection was lost. 


###Install

```bash
$ npm install spade [-g]
// clone repo
$ git clone git@github.com:rootslab/spade.git
```
> __require__

```javascript
var Spade = require( 'spade' );
```
> See [examples](example/).

###Run Tests

```bash
$ cd spade/
$ npm test
```

###Run Benchmark

> __NOTE__: You need a running Redis Server to execute benchmarks.

```bash
$ cd spade/
$ npm run-script bench
```

###Constructor

> Create an instance, the argument within [ ] is optional.

```javascript
Spade( [ Object opt ] )
// or
new Spade( [ Object opt ] )
```

####Options

> Default options are listed.

```javascript
opt = {
    /*
     * Syllabus develop option to restrict
     * commands to a particular Redis version.
     *
     * - A boolean 'true' enable develop mode.
     * - A semver string like '1.0.0' enbale develop mode
     *   and restrict commands to Redis 1.0.0.
     *
     * See https://github.com/rootslab/syllabus.
     */
    semver : false
    /*
     * Cocker socket options
     */
    , socket : {
        address : {
            host : 'localhost'
            , port : 6379
        }
        , reconnection : {
            trials : 3
            , interval : 1000
        }
    }
}
```

### Properties

```javascript
/*
 * A property that holds the initial config object.
 */
Spade#options : Object

/*
 * A flag to indicates if the connection to Redis Server
 * is currently active.
 */
Spade#ready

/*
 * An Object that holds all Redis commands/methods mix-ins
 * from Syllabus. It is a shortcut for Spade.syllabus.commands.
 */
Spade#commands : Object

/*
 * Some shortcuts to internal modules.
 */

Spade#syllabus

Spade#cocker

Spade#libra
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Connect to Redis Server, when the connection is fully
 * established, 'ready' event will be emitted.
 * You can optionally use a cback that will be executed on
 * the 'ready' event. 
 * It returns the current Spade instance.
 *
 * NOTE: You don't need to listen for the 'ready' event, commands
 * will be queued in "offline mode" and written to socket when the
 * connection will be ready.
 *
 * socket_opt = {
 *      address : {
 *          host : 'localhost'
 *          , port : 6379
 *      }
 *      , reconnection : {
 *          trials : 3
 *          , interval : 1000
 *      }
 *  }
 */
Spade#connect( [ Object socket_opt [, Function cback] ] ) : Spade

/*
 * Disconnect from Redis Server.
 * You can optionally use a cback that will be executed after socket
 * disconnection.
 * It returns the current Spade instance.
 *
 * NOTE: From the client point of view it has the same effect of
 * sending and executing the Redis QUIT command. Connection will be
 * closed and no other attempts will be made.
 */
Spade#disconnect( [ Object socket_opt [, Function cback] ] ) : Spade

```

##Events

```javascript
/*
 * Connection was fully established.
 */
'ready' : function ( Object address ) : undefined

/*
 * Connection is down ( on the first 'close' event for the socket ).
 */
'offline' : function ( Object address ) : undefined

/*
 * Client is trying to reconnect to Redis server, k is the number
 * of current connection attempt.
 *
 * NOTE: 'millis' indicates the last interval of time between attempts.
 */
'attempt' : function ( Number k, Object address, Number millis ) : undefined

/*
 * Connection is definitively lost ( after opt.reconnection.trials times )
 */
'lost' : function ( Object address ) : undefined

/*
 * A parser or command error has occurred.
 */
'error' : function ( Error err, Object command ) : undefined

```

------------------------------------------------------------------------


### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.