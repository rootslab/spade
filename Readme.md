###♠ Spade
[![build status](https://secure.travis-ci.org/rootslab/spade.png?branch=master)](http://travis-ci.org/rootslab/spade) 
[![NPM version](https://badge.fury.io/js/spade.png)](http://badge.fury.io/js/spade)
[![build status](https://david-dm.org/rootslab/spade.png)](https://david-dm.org/rootslab/spade)

[![NPM](https://nodei.co/npm/spade.png?downloads=true&stars=true)](https://nodei.co/npm/spade/)

[![NPM](https://nodei.co/npm-dl/spade.png)](https://nodei.co/npm/spade/)

> ♠ _**Spade**_, a full-featured __Redis__ client module, with __offline queue__ for commands, automatic __socket reconnection__ and __command rollback__ mechanism for __subscriptions__ and __incomplete transactions__.

> It also supports __LUA scripts caching__ via __[Σ Syllabus](https://github.com/rootslab/syllabus)__ and __[Camphora](https://github.com/rootslab/camphora)__ modules.

> It also possible to __restrict commands to a particular Redis version__ via constructor options.

> ♠ __Spade__ is a __simple and clean__ modular library, it makes use of some __well tested__ modules:
 - __[Σ Syllabus](https://github.com/rootslab/syllabus)__ module for __command encoding__ and __command helpers mix-ins__, it also offers a series of __helpers functions__ to convert a raw data reply in a usable format.
 > Internally it uses __[Hoar](https://github.com/rootslab/hoar)__ module to handle __Semantic Versioning 2.0__, __[Sermone](https://github.com/rootslab/sermone)__ to encode commands, __[Abaco](https://github.com/rootslab/abaco)__ and __[Bolgia](https://github.com/rootslab/bolgia)__ modules to get some utilities. Moreover, __Syllabus__ mantains a __cache__ for __LUA__ scripts, using the __[Camphora](https://github.com/rootslab/camphora)__ module.
 - __[♎ Libra](https://github.com/rootslab/libra)__ module to handle bindings between commands which have been sent and relative __Redis__ replies; it handles also __commands queue rollbacks__ with the help of __[Train](https://github.com/rootlsab/train)__ module.
 - __[Cocker](https://github.com/rootslab/cocker)__ module to properly handle __socket reconnection__ when the connection is lost. 
 - __[Hiboris](https://github.com/rootslab/hiboris)__, a utility module to load  __[hiredis](https://github.com/redis/hiredis-node)__ _native parser_, or to fall back to __[Boris](https://github.com/rootslab/boris)__, a _pure js parser_ module for __Redis__ replies; internally _Boris_ uses __[Peela](https://github.com/rootslab/peela)__ as command stack.

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

> __NOTE__: You need a running __Redis Server__ instance to execute benchmarks.

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
     * - A semver string like '1.0.0' enable develop mode
     *   and restrict commands to Redis version 1.0.0.
     *
     * See https://github.com/rootslab/syllabus.
     */
    semver : false

    /*
     * Hiboris option, for default the 'hiredis'
     * native parser is disabled in favour of
     * Boris JS parser.
     */
    , hiredis : false

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
        , connection : {
            /*
             * encoding could be: 'ascii', 'utf8', 'utf16le' or 
             * 'ucs2','buffer'. It defaults to null or 'buffer'.
             */
            encoding : null
            /*
             * keepAlive defaults to true ( it is false in net.Socket ).
             * Specify a number to set also the initialDelay.
             */
            , keepAlive : true
            /*
             * 'timeout' event delay, default is 0 ( no timeout )
             */
            , timeout : 0
            /*
            * noDelay is true for default, it disables the Nagle
            * algorithm ( no TCP data buffering for socket.write )
            */
            , noDelay : true
            /*
             * If true, the socket won't automatically send a FIN
             * packet when the other end of the socket sends a FIN
             * packet. Defaults to false.
             */
            , allowHalfOpen : false
        }
        , path : {
            fd : undefined
            , readable : true
            , writable : true
        }
    }
}
```

### Properties

> Don't mess with these properties!

```javascript
/*
 * A property that holds the initial config object.
 */
Spade.options : Object

/*
 * An Object that holds all Redis commands/methods mix-ins
 * from Syllabus. It is a shortcut for Spade.mixins.commands.
 * See https://github.com/rootslab/syllabus#syllabus-commands.
 */
Spade.commands : Object

/*
 * A flag to indicate if the connection to Redis Server
 * is currently active.
 */
Spade.ready : Boolean

/*
 * A flag to avoid initializing scripts cache multiple times,
 * when the client is offline ( multiple #initCache() calls ).
 */
Spade.cacheready : Boolean

/*
 * Some shortcuts to internal modules.
 */

/*
 * Cocker module that inherits from net.Socket.
 */
Spade.socket : Cocker

/*
 * Parser module, it could be an instance of Hiboris, a module
 * wrapper for the hiredis native parser, or the Boris JS parser.
 */
Spade.parser : Hiboris | Boris

/*
 * Libra Queue Manager for Commands/Replies bindings.
 */
Spade.queue : Libra

/*
 * Property that contains all mix-ins for the current semantic
 * version specified. Spade default value is false, interpreted
 * as '*'.
 *
 * NOTE: Specifying a particular semver version enables develop
 * mode, some mix-ins will be added to get infos about commands.
 * See Syllabus module for some examples.
 */
Spade.mixins : Syllabus

/*
 * A property that holds LUA commands and Cache, a shortcut
 * for Spade.mixins.lua.
 * See https://github.com/rootslab/syllabus#properties-methods.
 */
Spade.lua : Object

/*
 * Current cache property, an instance of Camphora.
 */
Spade.lua.cache : Camphora
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Connect to Redis Server, when the connection is fully established,
 * 'ready' event will be emitted. You can optionally use a cback that
 * will be executed on the 'ready' event.
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
 *      , connection : {
 *          ...
 *      }
 *  }
 */
Spade#connect( [ Object socket_opt [, Function cback ] ] ) : Spade

/*
 * Disconnect from Redis Server.
 * You can optionally use a cback that will be executed after socket
 * disconnection.
 * It returns the current Spade instance.
 *
 * NOTE: From the client point of view it has the same effect of
 * sending and executing the Redis QUIT command. Connection will be
 * closed and no other re-connection attempts will be made.
 */
Spade#disconnect( [ Function cback ] ) : Spade

/*
 * Initialize LUA script cache, loading and sending all the files
 * found in the './node_modules/syllabus/lib/lua/scripts' directory,
 * to the Redis Server.
 * It triggers 'cacheinit', 'cacheload', 'cacheready' and 'scriptfailure'
 * events. See "Script Cache Events" Section.
 *
 * Optionally you could specify:
 *
 * - A custom loading path with 'file_load_opt':
 *  {
 *   filepath : '/my/scripts/dir'
 *  };
 *
 *   See Camphora#load for a list of available options:
 *   https://github.com/rootslab/camphora#options
 *
 *   NOTE: Empty files and scripts processed and refused by Redis with
 *   an error reply, are automatically evicted from the cache.
 *
 * - A custom init configuration for the Camphora costructor to build or
 *   rebuild the cache.
 *   Default values for 'camphora_cache_opt' are:
 *  {
 *    capacity : 128
 *    , encrypt_keys : false
 *    , algorithm : 'sha1'
 *    , output_encoding : 'hex'
 *    , input_encoding : 'binary'
 *  }
 *
 *   NOTE: if 'camphora_cache_opt' is set, cache will be re-initialized;
 *   it happens only if the cache is ready, or when no other script commands
 *   are already been queued and not yet been sent to Redis ( for example, when
 *   the client is offline ); otherwise option object will be ignored and cache
 *   will remain intact.
 */
 Spade#initCache( [ Object file_load_opt [, Object camphora_cache_opt ] ] ) : undefined
```

####LUA Cache and SCRIPT Methods

```javascript
/*
 * Send/Run a script from the cache.
 */
Spade.lua.script#run( String name, Array keys, Array args [, Function cback ] ) : undefined
 
/*
 * Manually load a script into the cache and send it to Redis.
 */
Spade.lua.script#load( String key, String data [, Function cback ] ) : undefined
 
/*
 * Clear Spade and Redis cache.
 */
Spade.lua.script#flush( [ Function cback ] ) : undefined
```
> See **_Syllabus.lua_** at _https://github.com/rootslab/syllabus#properties-methods_.

##Events

####PubSub Events

```javascript
/*
 * A message was received from PubSub system when the client is in
 * Subscrition (PubSub) mode.
 */
'message' : function ( Array message ) : undefined
```

####Monitor Events

```javascript
/*
 * A message was received when the client is in Monitor mode.
 */
'monitor' : function ( String message ) : undefined
```

####Error Events

```javascript
/*
 * A parser or command encoding error has occurred.
 */
'error' : function ( Error err, Object command ) : undefined
```

####Script Cache Events

```javascript
/*
 * Cache was initialized, script files are loaded in memory and a list of
 * SCRIPT LOAD commands are ready to be written to the socket.
 */
'cacheinit' : function ( Array script_load_commands ) : undefined

/*
 * A script was processed and refused by Redis with an error reply.
 * Errored scripts are not added to local cache.
 */
'scriptfailure' : function ( String script_name, String error_message ) : undefined

/*
 * A script was loaded in the cache and was successfully processed by Redis.
 */
'cacheload' : function ( String script_name, Buffer data, String txt ) : undefined

/*
 * All scripts, found in the Syllabus scripts directory, are written to socket
 * and processed by Redis.
 *
 * NOTE: 'cacheready' event happens always after the 'ready' connection event,
 * because all scripts should be processed by Redis before launching this event.
 *
 * NOTE: cache for LUA scripts is an instance of Camphora module.
 */
'cacheready' : function ( Camphora lua_script_cache ) : undefined
```

####Socket Connection Events

```javascript
/*
 * Connection was fully established.
 */
'ready' : function ( Object address ) : undefined

/*
 * Connection is currently down ( on the first 'close' event from the socket ).
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
 * Connection is definitively lost ( after opt.reconnection.trials times ).
 */
'lost' : function ( Object address ) : undefined

/*
 * Socket times out for inactivity.
 * It only notifies that the socket has been idle.
 */
'timeout' : function ( Object address, Number timeout ) : undefined
```

-------------------------------------------------------------------------------


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