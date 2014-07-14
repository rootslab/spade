###♠ Spade
[![build status](https://secure.travis-ci.org/rootslab/spade.png?branch=master)](http://travis-ci.org/rootslab/spade) 
[![NPM version](https://badge.fury.io/js/spade.png)](http://badge.fury.io/js/spade)
[![build status](https://david-dm.org/rootslab/spade.png)](https://david-dm.org/rootslab/spade)
[![devDependency Status](https://david-dm.org/rootslab/spade/dev-status.png)](https://david-dm.org/rootslab/spade#info=devDependencies)
[![NPM](https://nodei.co/npm/spade.png?downloads=true&stars=true)](https://nodei.co/npm/spade/)

[![NPM](https://nodei.co/npm-dl/spade.png)](https://nodei.co/npm/spade/)

> ♠ _**Spade**_, a full-featured, multi-modular __Redis__ client:
 - It offers the ability to restrict __commands to a particular Redis version__ via the _**semver**_
   constructor option. Specifying this option turns __Spade__ in _develop mode_, it enables a series
   of mix-ins to get brief descriptions of every implemented command.
 - It implements a simple __delayed mechanism for re-connecting to socket__ when the client connection was
   not voluntarily interrupted.
 - It collects commands in the __queue__ also when the client is __offline__.
 - It implements an automatic __command rollback__ mechanism for __subscriptions__ and __incomplete
   transactions__, when connection is lost and becames ready again.
 - It implements __AUTH__ logic and __automatic db SELECT__ on socket (re)connection, configurable
   via the _**security**_ constructor option.
 - It offers automatic __LUA scripts caching__, using a simple __NFU__ with __linear aging__ eviction
   algorithm ( __NFU__ stands for _Not Frequently Used_ ).

> ♠ __Spade__ makes use of some __well tested__ modules:
 - __[Σ Syllabus](https://github.com/rootslab/syllabus)__ module for __command encoding__ and __command helpers mix-ins__, it  also offers a series of __helpers functions__ to convert a raw data reply in a usable format.
 > Internally it uses __[Hoar](https://github.com/rootslab/hoar)__ module to handle __Semantic Versioning 2.0__, __[Sermone](https://github.com/rootslab/sermone)__ to encode commands, __[Abaco](https://github.com/rootslab/abaco)__ and __[Bolgia](https://github.com/rootslab/bolgia)__ modules to get some utilities. Moreover, __Syllabus__ mantains a __cache__ for __LUA__ scripts, using the __[Camphora](https://github.com/rootslab/camphora)__ module.
 - __[♎ Libra](https://github.com/rootslab/libra)__ module to handle bindings between commands which have been sent and relative __Redis__ replies; it handles also __commands queue rollbacks__ with the help of __[Train](https://github.com/rootslab/train)__ module.
 - __[Cocker](https://github.com/rootslab/cocker)__ module to properly handle __socket reconnection__ when the connection is lost. 
 - __[Hiboris](https://github.com/rootslab/hiboris)__, a utility module to load  __[hiredis](https://github.com/redis/hiredis-node)__ _native parser_, or to fall back to __[Boris](https://github.com/rootslab/boris)__, a _pure js parser_ module for __Redis__ string protocol; internally _Boris_ uses __[Peela](https://github.com/rootslab/peela)__ as command stack.

###Table of Contents

- __[Install](#install)__
- __[Run Tests](#run-tests)__
- __[Run Benchmarks](#run-benchmarks)__
- __[Constructor](#constructor)__
   - __[Options](#options)__
- __[Properties](#properties)__
- __[Methods](#methods)__
   - __[Redis Commands](#redis-commands)__
   - __[LUA Cache and SCRIPT Methods](#lua-cache-and-script-methods)__
- __[Events](#events)__
   - __[Event Sequence Diagram](#event-sequence-diagram)__
   - __[Error Events](#error-events)__
   - __[Auth Events](#auth-events)__
   - __[Select Events](#select-events)__
   - __[Script Cache Events](#script-cache-events)__
   - __[Socket Connection Events](#socket-connection-events)__
   - __[PubSub Events](#pubsub-events)__
   - __[Monitor Events](#monitor-events)__
   - __[Other Debug Events](#other-debug-events)__
- __[MIT License](#mit-license)__

-----------------------------------------------------------------------

###Install

> __NOTE:__ only __node__ engines **">=v0.10.x"** are supported.

```bash
$ npm install spade [-g]
// clone repo
$ git clone git@github.com:rootslab/spade.git
```
> __install and update devDependencies__:

```bash
 $ cd spade/
 $ npm install --dev
 # update
 $ npm update --dev
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
> __NOTE__: tests need a running __Redis__ server instance, with default/stock configuration.

###Run Benchmarks

> run benchmarks for __spade__.

```bash
$ cd spade/
$ npm run-script bench
```
> run benchmarks for **node_redis**.

```bash
$ cd spade/
$ npm install redis
$ npm run-script node_redis_bench
```

> __NOTE__:
>  - benchmarks need a running __Redis__ server instance, with default/stock configuration.
>  - to switch to the faster __hiredis__ native parser, install **_devDependencies_** .

----------------------------------------------------------------------------------------------

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
     * Syllabus option to enable develop mode and restrict
     * commands to a particular Redis semantic version.
     * Use:
     * - boolean 'true' or string '*' for all commands available.
     * - semver string to restrict commands ( like '1.0.0' ).
     *
     * NOTE, develop mode enables some utility methods to get command
     * descriptions, like:
     * - Spade.mixins#info( String command ) get cmd infos
     * - Spade.mixins#size() get the current number of commands
     * - Spade.mixins#stick( [ Boolean attach ] ) attach #info to every mix-in.
     *
     * See https://github.com/rootslab/syllabus#properties-methods.
     */
    semver : null

    /*
     * Hiboris option. For default, the loading
     * of 'hiredis' native parser is disabled
     * in favour of ( the slower ) Boris JS parser.
     */
    , hiredis : false

    /*
     * Cocker socket options
     */
    , socket : {
        path : null
        , address : {
            // 'localhost'
            host : '127.0.0.1'
            , port : 6379
            , family : 'Ipv4'
        }
        , reconnection : {
            trials : 3
            , interval : 1000
            /*
             * A value to use for calculating the pause between two
             * connection attempts. Default value is the golden ratio.
             * Final value is calculated as:
             * interval * Math.pow( factor, curr.attempts + 1 )
             */
            , factor : ( Math.sqrt( 5 ) + 1 ) / 2
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
             * 'timeout' event delay, default is 0 ( no timeout ).
             */
            , timeout : 0
            /*
            * noDelay is true for default, it disables the Nagle
            * algorithm ( no TCP data buffering for socket.write ).
            */
            , noDelay : true
            /*
             * If true, the socket won't automatically send a FIN
             * packet when the other end of the socket sends a FIN
             * packet. Defaults to false.
             */
            , allowHalfOpen : false
        }
    }
    /*
     * Security options.
     *
     * Two sample entries are already present in the cache, holding default values
     * from redis.conf. An entry key could be a filepath or a network endpoint.
     *
     * Every entry should be a file path ('/path/to/file.sock'), or a network path
     * ('ip:port'), and should contain a:
     *
     * - 'requirepass' property, it contains the Redis password string for the current
     * host. It defaults to null. Whenever a client connection is established and if
     * an entry is found in the security hash. an AUTH command will be sent to Redis,
     * before any other command in the command queue.
     *
     * - 'db' property, it defaults to 0. On every reconnection the first command to
     * send after AUTH is SELECT db. If db === -1, on client reconnection the SELECT
     * command will not been sent.
     *
     * NOTE: If the AUTH reply is erroneous, an 'authfailed' event will be emitted,
     * then the client will be automatically disconnected to force re-AUTH on
     * reconnection; it also happens if AUTH isn't required by Redis, but was sent
     * by the client.
     * If authorization is granted by Redis, an 'authorize' event will be emitted,
     * then if the command queue is not empty, it will be processed.
     */
     , security : {
        // a network path (ip:port)
        '127.0.0.1:6379' : {
            requirepass : null
            , db : 0
        }
        // a unix domain socket path
        , '/tmp/redis.sock' : {
            requirepass : null
            , db : 0
        }
    }
}
```
_[Back to ToC](#table-of-contents)_

----------------------------------------------------------------------

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
 *
 * NOTE: the LUA script cache remains hidden until you explicitly
 * call the #initCache method.
 */
Spade.lua.cache : Camphora

/*
 * An array containing all event listeners for logging to console.
 * See Spade#cli.
 */
Spade.cli_debug : Array

```
_[Back to ToC](#table-of-contents)_

----------------------------------------------------------------------

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
 *          host : '127.0.0.1'
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
 * Initialize or reveal the (hidden) LUA script cache. It loads and sends
 * all the files found in the './node_modules/syllabus/lib/lua/scripts'
 * directory, to the Redis Server ( after the 'ready' event ).
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
 * - You can optionally use a cback that will be executed on 'cacheready',
 *   with the current cache instance as argument.
 *   See also "Script Cache Events" section.
 *
 *   NOTE: if 'camphora_cache_opt' is set, cache will be re-initialized;
 *   it happens only if the cache is ready, or when no other script commands
 *   are already been queued and not yet been sent to Redis ( for example, when
 *   the client is offline ); otherwise option object will be ignored and cache
 *   will remain intact.
 */
Spade#initCache( [ Object file_load_opt [, Object camphora_cache_opt, [ Function cback ] ] ] ) : undefined

/*
 * Enable event logging to console.
 * This method enables/logs some extra event for debugging/testing purpose,
 * like:
 * - 'reply' for Redis replies.
 * - 'scanqueue' when the "offline" command queue is processed.
 * - 'queued' for commands executed when the client is offline.
 * See "Other Debug Events" section.
 * 
 * NOTE: 
 * - 'enable' option defaults to true.
 * - default 'logger' function prints the event name and its arguments to console.
 */
Spade#cli( [ Boolean enable [, Function logger ] ] ) : undefined
```
_[Back to ToC](#table-of-contents)_

####Redis Commands

> __Spade.commands__ property contains all methods to encode and send __Redis__ commands,
> via the __Syllabus__ module.

> __Brief List of Redis Command Types:__
> - __Keys__ : _23 commands_.
> - __Strings__ : _26 commands_.
> - __Hashes__ : _14 commands_.
> - __Lists__ : _17 commands_.
> - __Sets__ : _15 commands_.
> - __Sorted Sets__ : _20 commands_.
> - __HyperLogLog__ : _3 commands_.
> - __PubSub__ : _8 commands_.
> - __Transactions__ : _5 commands_.
> - __Scripting__ : _6 commands_.
> - __Connection__ : _5 commands_.
> - __Server__ : _27 commands_.

> See **_[Syllabus Commands Section](https://github.com/rootslab/syllabus#syllabus-commands)_** for all signatures and available commands.


> __Every command mix-in accepts a callback__ function as the last argument, this __callback__ will get __3__ arguments:

```javascript
'callback' : function ( Boolean is_err_reply, Array data, Function reveal ) {
    /*
     * 'is_err_reply' is a Boolean that signals an ERROR reply from Redis,
     * ( not a JS Error ), then reply data will contain the error message(s).
     *
     * 'data' is a list containing reply data Buffers.
     *
     * 'reveal' is a utility function that converts the raw Redis Reply in
     * a simple and usable form.
     *
     * NOTE: The utility function is not the same for all command replies,
     * because, as we surely know, some reply needs particular format and 
     * type conversions.
     */
}
```
> __Example Code__:

```javascript
var log = console.log
    , Spade = require( 'spade' )
    , client = Spade( {} )
    ;

// start async connection to Redis
client.connect();

// execute TIME command
client.commands.time( function ( is_err_reply, reply_data_arr, reveal_fn ) {
    log( '\n- error reply:', is_err_reply );
    log( '- raw reply:', reply_data_arr );
    log( '- converted reply:', reveal_fn( reply_data_arr ) );
} );
```

####LUA Cache and SCRIPT Methods

> Manually execute scripts commands, differently from _**Spade.commands.script**_ methods,
> these ones will also update the hidden cache for __LUA__ scripts.

```javascript
/*
 * Get a script from the cache and send it to Redis.
 * It executes an EVALSHA command with the digest of the current script ( if it exists ).
 */
Spade.lua.script#run( String name, Array keys, Array args [, Function cback ] ) : undefined
 
/*
 * Manually load a script into the cache and send it to Redis. It executes a SCRIPT LOAD 
 * command. 'lback' function will be called with an argument that represents the entry
 * loaded in the cache, or undefined if an error occurs.
 */
Spade.lua.script#load( String key, String data [, Function cback [, Function lback ] ] ) : undefined
 
/*
 * Clear Spade and Redis cache. It executes a SCRIPT FLUSH command.
 * 'fback' function will be called with the number of elements flushed from the cache.
 */
Spade.lua.script#flush( [ Function cback [, Function fback ] ] ) : undefined
```
> __See__ **_[initCache](#methods)_** method for loading script files and for revealing
> the hidden __LUA__ cache.

> __See__ also **_[Syllabus.lua](https://github.com/rootslab/syllabus#properties-methods)_**.

_[Back to ToC](#table-of-contents)_

-----------------------------------------------------------------------------

##Events

- __[Event Sequence Diagram](#event-sequence-diagram)__
- __[Error Events](#error-events)__
- __[Auth Events](#auth-events)__
- __[Select Events](#select-events)__
- __[Script Cache Events](#script-cache-events)__
- __[Socket Connection Events](#socket-connection-events)__
- __[PubSub Events](#pubsub-events)__
- __[Monitor Events](#monitor-events)__
- __[Other Debug Events](#other-debug-events)__

####Event Sequence Diagram

>  - the event emitted for first could be:
    - **_connect_** or **_offline_**, after the execution of __connect__ or __disconnect__ methods.
    - **_cacheinit_**, after the execution of __initCache__ method.
    - **_error_**, it _"simply"_ happens.

```javascript
                             +                                     +
                             |                                     |
                             v                                     v
                          connect+------->(timeout)              error
                             +
                             |
                             +-------->(authorized)                +
                             |               +                     |
                             V               |                     v
              +         (authfailed)   +-----+-----+          (cacheinit)
              |              +         |           |               +
              v              |         v           v               |
  +------->offline<----------+----+(dbfailed) (dbselected)         |
  |           +              |                     +               |
  |           |              |                     |               |
  +           v              |                     v               |
lost<-----(*attempt*)        +------------------+ready+------------+
  +           +                                    +               |
  |           |            (*monitor*)<--+         |               v
  |           |                          |         |      +--------+-------+
  +->connect<-+                          +---------+      |                |
        +                                |                v                v
        |                  (*message*)<--+        (*scriptfailure*)   (*cacheload*)
        v                                                 +                +
       ...                                                |                |
                                                          +--------+-------+
                                                                   |
                                                                   v
                                                              (cacheready)
```

> __NOTE__:
>  - events between __(__ __)__ could never happen, most of them depends on client configuration.
>  - events within __*__ could be emitted more than once, namely _0_ or _k_ times with _k >= 1_.
>  - __timeout__ could happen in _"any"_ moment after the __connect__ event.

_[Back to ToC](#table-of-contents)_

####Error Events

```javascript
/*
 * A parser or command encoding error has occurred.
 */
'error' : function ( Error err, Object command ) : undefined
```

####Auth Events

> These events are emitted on every client (re)connection to Redis and only if
> __AUTH is set to be mandatory__ for the current connected host; namely, should
> exist an entry, _'ip:port'_ or _'/path/to/file'_, with __requirepass__ property
> set to a non empty string.

```javascript
/*
 * The reply to AUTH command is an Error, then client will be disconnected; it also
 * happens when AUTH is not required by Redis but issued by the client. No 'ready'
 * event could be launched.
 */
'authfailed' : function ( String password, Array reply, Object address ) : undefined

/*
 * Client authorization is successful. After that the command queue will be processed.
 * and the 'ready' event could be launched.
 */
'authorized' : function ( String password, Array reply, Object address ) : undefined
```

####Select Events

> These events are emitted on every client (re)connection to __Redis__. If the __db__
> property is set for the current connected host in the __security__ options/cache, the
> __SELECT__ db command will be sent before all other commands in the queue.
>
> __NOTE__:
> When __Redis needs authentication__, __SELECT__ command will be sent __only after__
> having sent the __AUTH__ command and having received a successful reply from __Redis__.

```javascript
/*
 * The reply to SELECT command is an Error, then client will be disconnected.
 * No 'ready' event could be launched.
 */
'dbfailed' : function ( String db, Array reply, Object address ) : undefined

/*
 * Client authorization is successful. Now the command queue will be processed,
 * the 'ready' event could be launched.
 */
'dbselected' : function ( String db, Array reply, Object address ) : undefined
```

####Script Cache Events

```javascript
/*
 * Cache was initialized, script files are loaded in memory and a list
 * of SCRIPT LOAD commands are ready to be written to the socket.
 * Now that script commands are queued, it is possible to use and send
 * these and other commands.
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
 * After that the client has established a connection to the Redis host,
 * it is now ready to write commands to the socket and to receive the
 * relative replies from Redis. It happens after processing AUTH and
 * SELECT commands and finally the offline queue.
 *
 * NOTE: Every commands executed by the client before the 'ready' event,
 * will be enqueued in 'offline mode' and sent/written to socket when
 * 'ready' will be emitted.
 */
'ready' : function ( Object address ) : undefined

/*
 * A client connection is fully established with Redis host. This event
 * happens before 'ready' and AUTH/SELECT related events.
 */
'connect' : function ( Object address ) : undefined

/*
 * Connection is currently down ( on the first 'close' event from the socket ).
 */
'offline' : function ( Object address ) : undefined

/*
 * Client is trying to reconnect to Redis server, k is the number of current
 * connection attempt.
 *
 * NOTE: 'millis' indicates the last interval of time between attempts.
 */
'attempt' : function ( Number k, Number millis, Object address ) : undefined

/*
 * The connection is definitively lost ( after opt.reconnection.trials times ).
 */
'lost' : function ( Object address ) : undefined

/*
 * The socket times out for inactivity.
 * It only notifies that the socket has been idle.
 */
'timeout' : function ( Number timeout,  Object address ) : undefined
```

####PubSub Events

> __NOTE__: callbacks for (__P__)(__UN__)__SUBSCRIBE__ commands are disabled; it is
> not always possible to mantain bindings between commands callbacks and messages
> received through the _Pub/Sub_ system, when the client is in _Pub/Sub_ mode, all
> commands replies will be received as messages.
>
> For example:
>  - _subscribe( [ 'a', 'a', 'b', 'b', 'c', 'c' ] )_ produces 6 messages with 3 actual subscriptions.
>  - _unsubscribe()_ produces 3 messages with 0 subscriptions.

```javascript
/*
 * A message was received from PubSub system when the client is in
 * PubSub mode.
 */
'message' : function ( Array message ) : undefined

/*
 * An event to signal that the client is in PubSub mode. From now all
 * replies to (un)subscrition commands will be received as messages.
 * 
 */
'listen' : function () : undefined

/*
 * An event to signal that client is leaving PubSub mode after a
 * unsubscription command.
 */
'shutup' : function () : undefined
```

####Monitor Events

```javascript
/*
 * A 'message' was received when the client is in Monitor mode.
 * 
 * NOTE: the 'formatter' function converts the 'message' to an
 * object/hash; for example, with an input like:
 *
 * 'monitor 1404871788.612598 [0 127.0.0.1:35604] "ping"',
 *
 * it will output:
 *
 * {
 *  ip : '127.0.0.1'
 *  , port : 35604
 *  , utime : 1404871788612
 *  , msecs :  0.598
 *  , db : 0
 *  , cmd : '"ping"'
 * }
 *
 * See also Syllabus.formatters.
 *
 */
'monitor' : function ( String message, Function formatter ) : undefined
```

####Other Debug Events

> __NOTE__: to enable logging for events below, execute __Spade#cli__ method.

```javascript
/*
 * When the client will be online once again, this event is emitted
 * before performing a scan for sending enqueued commands.
 */
'scanqueue' : function ( Number offline_queue_size ) : undefined

/*
 * the client receives a command reply from Redis.
 */
'reply' : function ( Boolean is_err, Object command, String reply ) : undefined

/*
 * When the client is offline, commands are not sent but queued.
 */
'queued' : function ( Object command, Number offline_queue_size ) : undefined
```

_[Back to ToC](#table-of-contents)_

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