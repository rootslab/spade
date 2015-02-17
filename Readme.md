###♠ Spade

[![NPM VERSION](http://img.shields.io/npm/v/spade.svg?style=flat)](https://www.npmjs.org/package/spade)
[![CODACY BADGE](https://img.shields.io/codacy/b18ed7d95b0a4707a0ff7b88b30d3def.svg?style=flat)](https://www.codacy.com/public/44gatti/spade)
[![CODECLIMATE](http://img.shields.io/codeclimate/github/rootslab/spade.svg?style=flat)](https://codeclimate.com/github/rootslab/spade)
[![CODECLIMATE-TEST-COVERAGE](https://img.shields.io/codeclimate/coverage/github/rootslab/spade.svg?style=flat)](https://codeclimate.com/github/rootslab/spade)
[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/rootslab/spade#mit-license)

[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/spade.svg?style=flat)](http://travis-ci.org/rootslab/spade)
[![BUILD STATUS](http://img.shields.io/david/rootslab/spade.svg?style=flat)](https://david-dm.org/rootslab/spade)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/spade.svg?style=flat)](https://david-dm.org/rootslab/spade#info=devDependencies)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/spade.svg?style=flat)](http://npm-stat.com/charts.html?package=spade)

[![NPM GRAPH1](https://nodei.co/npm-dl/spade.png)](https://nodei.co/npm/spade/)

[![NPM GRAPH2](https://nodei.co/npm/spade.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/spade/)

[![status](https://sourcegraph.com/api/repos/github.com/rootslab/spade/.badges/status.png)](https://sourcegraph.com/github.com/rootslab/spade)
[![views](https://sourcegraph.com/api/repos/github.com/rootslab/spade/.counters/views.png)](https://sourcegraph.com/github.com/rootslab/spade)
[![views 24h](https://sourcegraph.com/api/repos/github.com/rootslab/spade/.counters/views-24h.png)](https://sourcegraph.com/github.com/rootslab/spade)

> ♠ __Spade__, a robust, full-featured, multi-modular __Redis__ client:
 - It offers the ability to restrict __commands to a particular Redis version__ via the _**semver**_
   constructor option. Specifying this option turns __Spade__ in _develop mode_, it enables a series
   of mix-ins to get brief descriptions of every implemented command.
 - It implements a simple __delayed mechanism for re-connecting to socket__ when the client connection was
   not voluntarily interrupted.
 - It collects commands in the __queue__ also when the client is __offline__.
 - It implements an automatic __command rollback__ mechanism for __subscriptions__ when connection is lost and becames ready again.
 - It implements __AUTH__ logic and __automatic db SELECT__ on socket (re)connection, configurable
   via the _**security**_ constructor option.
 - It offers automatic __LUA scripts caching__, using a simple __NFU__ with __linear aging__ eviction
   algorithm ( __NFU__ stands for _Not Frequently Used_ ).
 - It __correctly handles multiple (p)(un)subscription__ commands as we will expect (1 command : multiple replies : multiple callback execution); it was well tested against some weird edge cases.
 See __[tests](#run-tests)__ for pubsub.
 - It supports the new __PING__ command signature also in __PubSub mode__.
 - It implements a __polling mechanism__, useful to force __automatic re-connection__ when client hangs while in __PubSub mode__.
 - It facilitates scanning of Redis keyspace, implementing some simple iterators for __SCAN__/__HSCAN__/__SSCAN__/__ZSCAN__ commands. See [#loadIterators](#loaditerators).

> ♠ __Spade__ makes use of some __well tested__ modules:
 - __[Σ Syllabus](https://github.com/rootslab/syllabus)__ module for __command encoding__ and __command helpers mix-ins__, it  also offers a series of __helpers functions__ to convert a raw data reply in a usable format.
 > Internally it uses __[Hoar](https://github.com/rootslab/hoar)__ module to handle __Semantic Versioning 2.0__, __[Sermone](https://github.com/rootslab/sermone)__ to encode commands, __[Abaco](https://github.com/rootslab/abaco)__ and __[Bolgia](https://github.com/rootslab/bolgia)__ modules to get some utilities. Moreover, __Syllabus__ mantains a __cache__ for __LUA__ scripts, using the __[Camphora](https://github.com/rootslab/camphora)__ module.
 - __[♎ Libra](https://github.com/rootslab/libra)__ module to handle bindings between commands which have been sent and relative __Redis__ replies; it handles also __commands queue rollbacks__ with the help of __[Train](https://github.com/rootslab/train)__ module.
 - __[Cocker](https://github.com/rootslab/cocker)__ module to properly handle __socket reconnection__ when the connection is lost. 
 - __[Hiboris](https://github.com/rootslab/hiboris)__, a utility module to load  __[hiredis](https://github.com/redis/hiredis-node)__ _native parser_, or to fall back to __[Boris](https://github.com/rootslab/boris)__, a _pure js parser_ module for __Redis__ string protocol; internally _Boris_ uses __[Peela](https://github.com/rootslab/peela)__ as command stack.
 - __[Cucu](https://github.com/rootslab/cucu)__, a tiny module to handle the __scheduled execution of repetitive methods/tasks__.
 - __[Gerry](https://github.com/rootslab/gerry)__, a tiny module to handle __event logging__ to console, for debugging and testing purpose.
 - __[Dado](https://github.com/rootslab/dado)__, for running tests.
 - __[Vapid](https://github.com/rootslab/vapid)__, a vacuous __Redis__ implementation, with fully functional PubSub system.

> __NOTE__ : If you need a __minimal Redis client__ based on __♠ Spade__ code, __specific for PubSub and Monitor mode__ try 🂢 __[Deuces](https://github.com/rootslab/deuces)__.

###Table of Contents

- __[Install](#install)__
- __[Run Tests](#run-tests)__
- __[Run Benchmarks](#run-benchmarks)__
- __[Constructor](#constructor)__
   - __[Options](#options)__
- __[Properties](#properties)__
- __[Methods](#methods)__
   - __[#cli](#cli)__
   - __[#connect](#connect)__
   - __[#disconnect](#disconnect)__
   - __[#initCache](#initcache)__
   - __[#initTasks](#inittasks)__
      - __[polling task](#polling-task)__
   - __[#loadIterators](#loaditerators)__
   - __[Redis Commands](#redis-commands)__
   - __[Command Callback](#command-callback)__
   - __[Interactive Mode](#interactive-mode)__
   - __[LUA Cache and SCRIPT Methods](#lua-cache-and-script-methods)__
- __[Events](#events)__
   - __[Events Sequence Diagram](#events-sequence-diagram)__
   - __[Error Events](#error-events)__
   - __[Auth Events](#auth-events)__
   - __[Select Events](#select-events)__
   - __[Script Cache Events](#script-cache-events)__
   - __[Socket Connection Events](#socket-connection-events)__
   - __[PubSub Events](#pubsub-events)__
   - __[Monitor Events](#monitor-events)__
   - __[Tasks Events](#tasks-events)__
      - __[polling events](#polling-events)__
   - __[Other Debug Events](#other-debug-events)__
      - __[iterators events](#iterators-events)__
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
 $ npm install
 # update
 $ npm update
```
> __require__

```javascript
var Spade = require( 'spade' );
```
> See [examples](example/).

###Run Tests

> __to run all test files, install devDependecies:__

```bash
 $ cd spade/
 # install or update devDependecies 
 $ npm install 
 # run tests
 $ npm test
```
> __to execute a single test file simply do__:

```bash
 $ node test/file-name.js
```
> __NOTE__:
>  - tests need a running __[Redis](http://redis.io/)__ server instance, with default/stock configuration ( port __6379__ ).
>  - for some connection tests you need the __[Vapid](https://github.com/rootslab/vapid)__ **_devDependency_**, a vacuous __Redis__ server module ( port __6380__ ).

###Run Benchmarks

> run benchmarks for __Spade__.

```bash
 $ cd spade/
 $ npm run bench
```
> run benchmarks for **node_redis**.

```bash
 $ cd spade/
 $ npm install redis
 $ npm run node_redis_bench
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
            , family : null
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
     * Options for db selection and password sending when the 
     * client connects to a particular host.
     * An entry will be automatically added with the socket.address
     * or socket.path defined in the constructor option. However,
     * two sample entries are already present in the cache, holding
     * default values from redis.conf. 
     *
     * Every entry should be a file path ('/path/to/file.sock'),
     * or a network path ('ip:port'), and should contain a:
     *
     * - 'requirepass' property, it contains the Redis password string
     * for the current host. It defaults to null.
     * Whenever a client connection is established and if an entry is
     * found in the security hash. an AUTH command will be sent to Redis,
     * before any other command in the command queue.
     *
     * - 'db' property, it defaults to 0. On every reconnection the first
     * command to send after AUTH is SELECT db. If db === -1, on client
     * reconnection the SELECT command will not been sent.
     *
     * NOTE: If the AUTH reply is erroneous, an 'authfailed' event will
     * be emitted, then the client will be automatically disconnected to
     * force re-AUTH on reconnection; it also happens if AUTH isn't required
     * by Redis, but was sent by the client.
     * If authorization is granted by Redis, an 'authorize' event will be
     * emitted, then if the command queue is not empty, it will be processed.
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
    /*
     * Command queue options.
     */
    , queue : {
        /*
         * Set the max size for the rollback queue.
         * It defaults to 2^16, to disable set it to 0.
         */
        rollback : 64 * 1024
        /*
         * Log the last access time to the queue's head.
         * It is disabled for default.
         *
         * NOTE: It is used to store the last time a reply was received. 
         */
        , timestamps : false
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
 * An Object that holds all scheduled tasks.
 * See Spade#initTasks method to load defaults entries like 'polling'.
 * See Spade.qq property to handle tasks.
 */
Spade.tasks : Object

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
 * Cucu module to handle tasks.
 * See https://github.com/rootslab/cucu
 */
Spade.qq : Cucu

/*
 * A property that holds iterators for commands like SCAN, HSCAN, SSCAN, ZSCAN,
 * loaded with Spade#loadIterators.
 */
Spade.iterators : Object

/*
 * Debug Properties
 */

/*
 * Gerry module to handle events logging.
 * See https://github.com/rootslab/gerry
 */
Spade.logger : Gerry

```
_[Back to ToC](#table-of-contents)_

----------------------------------------------------------------------

###Methods

> Arguments within [ ] are optional.

####cli

__Enable event logging to console__.

> This method enables/logs some extra event for debugging/testing purpose:
>  - __reply__ for Redis replies.
>  - __scanqueue__ when the "offline" command queue is processed.
>  - __queued__ for commands executed when the client is offline.

> __NOTE__:
>  - the _'enable'_ option defaults to true.
>  - the _'logger'_ fn gets event name and event arguments.

```javascript
Spade#cli( [ Boolean enable [, Function logger [, Boolean collect_events ] ] ] ) : undefined
```
> See "[Other Debug Events](#other-debug-events)" section.

_[Back to ToC](#table-of-contents)_

--------------------------------------------------------------------------------------------

####connect

__Open a connection to the Redis Server__:
>  - When the connection is fully established, the __ready__ event will be emitted.
>  - You can optionally use a callback that will be executed on the __ready__ event.
>  - It accepts an optional socket confguration object.
>  - It returns the current Spade instance.

> __NOTE__: You don't need to listen for the __ready__ event, commands
> will be queued in _"offline mode"_ and written to socket when the
> connection will be ready.

```javascript
/*
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
```
_[Back to ToC](#table-of-contents)_

---------------------------------------------------------------------------------------

####disconnect

__Disconnect client from the Redis Server__:
>  - You can optionally use a cback that will be executed after socket
>    disconnection.
>  - It returns the current Spade instance.

> __NOTE__: From the client point of view, executing disconnect has the same
> effect of sending and executing the Redis **_QUIT_** command. Connection will
> be closed and no other re-connection attempts will be made.

```javascript
Spade#disconnect( [ Function cback ] ) : Spade
```
_[Back to ToC](#table-of-contents)_

---------------------------------------------------------------------------------------

####initCache

__Initialize or reveal the (hidden) LUA script cache__:
>  - It loads and sends all the files found in the __./node_modules/syllabus/lib/lua/scripts__
>    directory, to the Redis Server, always after the __ready__ event.
>  - It triggers __cacheinit__, __cacheload__, __cacheready__ and __scriptfailure__ events.
>  - Optionally you could specify:
>    - a custom loading path with something like : _{ filepath : '/my/scripts/dir' }_.
>    - a custom init configuration for the Camphora costructor to (re)build the cache.
>    - a cback that will be executed on __cacheready__ passing the current cache instance
>      as argument.

> __NOTE__: Empty files and scripts, processed and then refused by Redis with an error reply,
> are automatically evicted from the cache.

> __NOTE__: If **_cache_opt_** is already set, the cache will be re-initialized; it happens
> only if the cache is ready, or when no other script commands are already been queued and
> not yet been sent to Redis (for example, when the client is offline); otherwise the cache
> will remain intact and an Error will be passed to the callback as the first argument.

```javascript
/*
 *  Default values for 'cache_opt' are:
 *  {
 *    capacity : 128
 *    , encrypt_keys : false
 *    , algorithm : 'sha1'
 *    , output_encoding : 'hex'
 *    , input_encoding : 'binary'
 *  }
 */
Spade#initCache( [ Object f_opt [, Object cache_opt, [ Function cback ] ] ] ) : undefined
```
> See [Camphora#load](https://github.com/rootslab/camphora#options) for a list of available
> options for cache.

> See "[Script Cache Events](#script-cache-events)" Section for the list of events.

_[Back to ToC](#table-of-contents)_

--------------------------------------------------------------------------------------------

####initTasks

> Load methods/tasks from __'spade/lib/tasks'__ directory.
> It returns the current _Spade.tasks_ property (or Cucu.ttable).

```javascript
// filenames should be without '.js' extension.
Spade#initTasks( [ Array file_list ] ) : Object
```

#####polling task

> For default, the 'connection.js' file exports/adds a single polling method to tasks.
> When _polling_ is enabled, the client starts to __PING__ server every 60 secs; it could
> be useful for testing connection aliveness, when the client is in PubSub mode.

> Start the polling task:

```javascript
Spade.tasks.polling.run( [ Number interval [, Array polling_fn_args [, Number times ] ] ] ) : Number
```
> the polling method could receive 4 optional arguments, through the __polling_fn_args__ Array:

```javascript
pollingFn : function ( [ Function cback [, String ping_msg [, Number timeout [, Boolean reconnect ] ] ] ] )
```
> for example:

```javascript
/*
 * Pinging server every 2 seconds, with a 'BANG!' message and stop after 10 times.
 * For every reply received client emits 'polling' event.
 * If no reply will be received within 1 sec, client emits the 'hangup' event, then
 * disconnects and reconnects to the server.
 */
 var client = require( 'spade' )()
 ...
 client.cli();
 client.connect();
 ...
 client.initTasks();

 client.tasks.polling.run( 2000, [ null, 'BANG!', 1000, true ], 10 );
 ...
 client.task.polling.stop();
 ..
```

> __NOTE__:
> - executing #initTasks, automatically enables/adds the __polling__ and __hangup__ events.
> - when in __PubSub__ mode, the __rollback mechanism doesn't save PINGs__ sent by the
>   polling task.

> See [Tasks Events](#tasks-events).

> See [Cucu](https://github.com/rootslab/cucu) to see all available options to handle tasks.

> See [polling tests](test/).

_[Back to ToC](#table-of-contents)_

--------------------------------------------------------------------------------------------

####loadIterators

> Load default iterators, for commands like __SCAN__, __SSCAN__, __HSCAN__, __ZSCAN__,
> from _'spade/lib/iterators'_ dir, you could restrict files to load, specifying some
> filenames without '.js' extension, for example: [ 'scan' ].

```javascript
Spade#loadIterators( [ Array file_list ] ) : Object
```
> It returns the current __Spade.iterators__ property filled with:

```javascript
Spade.iterators : {
   scan : function ( Number cursor [, Object opt [, Function cback ] ] ) : Object
   , hscan: function ( String key, Number cursor [, Object opt [, Function cback ] ] ) : Object
   , sscan: function ( String key, Number cursor [, Object opt [, Function cback ] ] ) : Object
   , zscan : function ( String key, Number cursor [, Object opt [, Function cback ] ] ) : Object
}

// you could use #next outside the callback to receive other results.
Object : { next : Function }

// default options for iterator commands:
opt : { match : null, count : 10 }

// 'cback' gets 3 arguments, you could call 'iterate' function inside the callback to receive next results.
cback : function ( Boolean is_err_reply, Array reply, Function iterate )

// reply Array for SCAN command:
reply : [ Boolean is_last_iter, Array keys, Number iter_counter, Number keys_counter ]

// for HSCAN, SSCAN, ZSCAN commands, the last element is the current hash/set/zset key being scanned.
reply : [ Boolean is_last_iter, Array keys, Number iter_counter, Number keys_counter, String key ]

```
> __NOTE__:
>  - signatures are the same as for relative __Spade.commands__, but they returns __iterator objects__.
>  - when console logging is enabled with __[Spade#cli](#cli)__, 3 additional __[debug events](#other-debug-events)__ will be added: 
>    - *__scan__*
>    - *__sscan__*
>    - *__hscan__*
>    - *__zscan__*

> See [scan example](example/iterator-scan-example.js).

> See [iterators events](#iterators-events).

_[Back to ToC](#table-of-contents)_

---------------------------------------------------------------------------------------

####Redis Commands

> The __Spade.commands__ property contains all methods to encode and send __Redis__ commands,
> via the __Syllabus__ module.

> __Brief List of Redis Command Types:__
> - [__Keys__](https://github.com/rootslab/syllabus#keys) : _23 commands_.
> - [__Strings__](https://github.com/rootslab/syllabus#strings) : _26 commands_.
> - [__Hashes__](https://github.com/rootslab/syllabus#hashes) : _14 commands_.
> - [__Lists__](https://github.com/rootslab/syllabus#lists) : _17 commands_.
> - [__Sets__](https://github.com/rootslab/syllabus#sets) : _15 commands_.
> - [__Sorted Sets__](https://github.com/rootslab/syllabus#sorted-sets) : _20 commands_.
> - [__HyperLogLog__](https://github.com/rootslab/syllabus#hyperloglog) : _4 commands_.
> - [__PubSub__](https://github.com/rootslab/syllabus#pubsub) : _8 commands_.
> - [__Transactions__](https://github.com/rootslab/syllabus#transactions) : _5 commands_.
> - [__Scripting__](https://github.com/rootslab/syllabus#scripting) : _6 commands_.
> - [__Connection__](https://github.com/rootslab/syllabus#connection) : _5 commands_.
> - [__Server__](https://github.com/rootslab/syllabus#server) : _32 commands_.

> See **_[Syllabus Commands Section](https://github.com/rootslab/syllabus#syllabus-commands)_** for all signatures and available commands.

####Command Callback

> __Every command mix-in accepts a callback__ function as the last argument, it will get __3__ arguments:

```javascript
/*
 * 'is_err_reply' is a Boolean that signals an ERROR reply from Redis,
 * ( not a JS Error ), then reply data will contain the error message(s).
 *
 * 'data' is a list containing reply data Buffers ( or Strings if hiredis is used ).
 *
 * 'reveal' is a utility function that converts the raw Redis Reply in a simple
 * and usable form.
 *
 * NOTE: The utility function is not the same for all command replies, because,
 * as we surely know, some reply needs particular format and type conversions.
 */
'callback' : function ( Boolean is_err_reply, Array data, Function reveal ) : undefined
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
    log( '- error reply:', is_err_reply );
    log( '- raw reply:', reply_data_arr );
    log( '- converted reply:', reveal_fn( reply_data_arr ) );
} );
```
_[Back to ToC](#table-of-contents)_

####Interactive Mode

> Specifying a __semver__ option ( like __*__ or __1.0.0__ ) enables _Syllabus_
> development mode for commands.

__Example Code for REPL__

```bash
$ cd spade/
$ node

# you can directly load the interactive example file executing:
# > cd spade/example
# > .load repl-example.js

# create a client instance with all commands (*)
> var client = require( './' )( { semver : '*' } )
..
# enable automatic console logging for events
> client.cli()
..
# get info about a command via mixins (Syllabus) property
> client.mixins.info('CoNfiG')

{ req: 'CoNfiG',
  name: 'config',
  args: -1,
  type: 'server',
  cmd: 'CONFIG',
  sub: 
   [ 'GET',
     'RESETSTAT',
     'REWRITE',
     'SET' ] }

# you can also stick the #info method to all available commands
> client.mixins.stick()

..returns a number..

# now get info about a method/command
> client.commands.ping.info()

{ req: 'ping',
  name: 'ping',
  args: 0,
  type: 'connection',
  cmd: 'PING',
  sub: [],
  url: 'http://redis.io/commands/ping',
  rtype: '+',
  since: '1.0.0',
  hint: 'PING',
  descr: 'Ping the server.' }

# now get info about a nested method/command
> client.commands.pubsub.numpat.info()

{ req: 'pubsub numpat',
  name: 'pubsub.numpat',
  args: 0,
  type: 'pubsub',
  cmd: 'PUBSUB NUMPAT',
  sub: [],
  url: 'http://redis.io/commands/pubsub',
  rtype: ':',
  since: '2.8.0',
  hint: 'PUBSUB NUMPAT',
  descr: 'Returns the total number of patterns all the clients are subscribed to.' }

# ok stop, now execute the command
> client.commands.pubsub.numpat()

!queued: [ { bulks: 2,
    cmd: 'PUBSUB',
    ecmd: '*2\r\n$6\r\nPUBSUB\r\n$6\r\nNUMPAT\r\n',
    fn: [Function],
    zn: [Function] },
  1 ]

# ops, command is not sent but queued, then open client connection..
> client.connect()
..
# read your reply, then quit or disconnect
> client.commands.quit()
..
```
> See **_[Syllabus Properties and Methods Section](https://github.com/rootslab/syllabus#properties-methods)_** and _[repl-example.js](example/repl-example.js)_.

_[Back to ToC](#table-of-contents)_

####LUA Cache and SCRIPT Methods

> Manually execute scripts commands, differently from _**Spade.commands.script**_ methods,
> _**Spade.lua.script**_ will also update the hidden cache for __LUA__ scripts.

> __NOTE__: these mix-ins are used internally by the **[initCache](#methods)** method ,
> for loading script files and for revealing the hidden __LUA__ cache.

##### Spade.lua.script property

```javascript
/*
 * Get a script from the cache and send it to Redis.
 * It executes an EVALSHA command with the digest of the current script,
 * if it already exists.
 */
#run( String name, Array keys, Array args [, Function cback ] ) : undefined
 
/*
 * Manually load a script into the cache and send it to Redis.
 * It executes a SCRIPT LOAD command. 'lback' function will be called with an
 * argument that represents the entry loaded in the cache, or undefined if an
 * error occurs.
 */
#load( String key, String data [, Function cback [, Function lback ] ] ) : undefined
 
/*
 * Clear Spade and Redis cache. It executes a SCRIPT FLUSH command.
 * 'fback' function will be called with the number of elements flushed from the
 * cache.
 */
#flush( [ Function cback [, Function fback ] ] ) : undefined
```
> See **_[Syllabus.lua](https://github.com/rootslab/syllabus#properties-methods)_**.

_[Back to ToC](#table-of-contents)_

-----------------------------------------------------------------------------

##Events

- __[Events Sequence Diagram](#events-sequence-diagram)__
- __[Error Events](#error-events)__
- __[Auth Events](#auth-events)__
- __[Select Events](#select-events)__
- __[Script Cache Events](#script-cache-events)__
- __[Socket Connection Events](#socket-connection-events)__
- __[PubSub Events](#pubsub-events)__
- __[Monitor Events](#monitor-events)__
- __[Other Debug Events](#other-debug-events)__

####Events Sequence Diagram

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
  +------->offline<----+-----+----+(dbfailed) (dbselected)         |
  |           +        |     |                     +               |
  |           |        |     |                     |               |
  +           v        |     |                     v               |
lost<----+(*attempt*)  |     +------------------+ready+------------+
  +           +        |                           +               |
  |           |        +--+(*monitor*)<--+         |               v
  |           |                          |         |      +--------+-------+
  +->connect<-+                          +---------+      |                |
        +                                |                v                v
        |                   (listen)<----+        (*scriptfailure*)   (*cacheload*)
        v                       +                         +                +
       ...                      |                         |                |
                                v                         +--------+-------+
                           (*message*)+--->(shutup)                |
                                                                   v
                                                              (cacheready)
```

> __NOTE__:
>  - events between __(__ __)__ could never happen, most of them depends on client configuration.
>  - events within __*__ could be emitted more than once, namely __0__ or __k__ times with _k >= 1_.
>  - __timeout__ could happen in _"any"_ moment after the __connect__ event.
>  - __listen__ signals that client is entering in subscription mode
>  - __shutup__ signals that client is (voluntarily) leaving subscription mode.
>  - __monitor__ mode could end only with a __QUIT__ command (then '_offline_').

_[Back to ToC](#table-of-contents)_

####Error Events

```javascript
/*
 * A parser or command encoding error has occurred.
 */
'error' : function ( Error err, Object command )
```

####Auth Events

> These events are emitted on every client (re)connection to Redis and only if
> __AUTH is set to be mandatory__ for the current connected host; namely, should
> exist an entry, _'ip:port'_ or _'/path/to/file'_, in the options.security hash,
> with __requirepass__ property set to a non empty string.

```javascript
/*
 * The reply to AUTH command is an Error, then client will be disconnected;
 * it also happens when AUTH is not required by Redis but issued by the client.
 * No 'ready' event could be launched.
 */
'authfailed' : function ( String password, Array reply, Object address )

/*
 * Client authorization was successful. After that, the command queue will be
 * processed and the 'ready' event could be launched.
 */
'authorized' : function ( String password, Array reply, Object address )
```
_[Back to ToC](#table-of-contents)_

####Select Events

> These events are emitted on every client (re)connection to __Redis__. If the __db__
> property is set ( >== 0 ) in the options.security hash, for the current connected
> Redis host, the __SELECT__ db command will be sent before all the other commands
> already present in the queue.
>
> __NOTE__:
> When __Redis needs authentication__, __SELECT__ command will be sent __only after__
> having sent the __AUTH__ command and having received a successful reply from __Redis__.

```javascript
/*
 * The reply to SELECT command is an Error, then client will be disconnected.
 * No 'ready' event could be launched.
 */
'dbfailed' : function ( String db, Array reply, Object address )

/*
 * Client authorization is successful. Now the command queue will be processed,
 * the 'ready' event could be launched.
 */
'dbselected' : function ( String db, Array reply, Object address )
```
_[Back to ToC](#table-of-contents)_

####Script Cache Events

```javascript
/*
 * Cache was initialized, script files are loaded in memory and a list
 * of SCRIPT LOAD commands are ready to be written to the socket.
 * Now that script commands are queued, it is possible to use and send
 * these and other commands.
 */
'cacheinit' : function ( Array script_load_commands )

/*
 * A script was processed and refused by Redis with an error reply.
 * Errored scripts are not added to local cache.
 */
'scriptfailure' : function ( String script_name, String error_message )

/*
 * A script was loaded in the cache and was successfully processed by Redis.
 */
'cacheload' : function ( String script_name, Buffer data, String txt )

/*
 * All scripts, found in the Syllabus scripts directory, are written to socket
 * and processed by Redis.
 *
 * NOTE: 'cacheready' event happens always after the 'ready' connection event,
 * because all scripts should be processed by Redis before launching this event.
 *
 * NOTE: cache for LUA scripts is an instance of Camphora module.
 */
'cacheready' : function ( Camphora lua_script_cache )
```
_[Back to ToC](#table-of-contents)_

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
'ready' : function ( Object address, Number queued_command_sent )

/*
 * A client connection is fully established with Redis host. This event
 * happens before 'ready' and AUTH/SELECT related events.
 */
'connect' : function ( Object address )

/*
 * Connection is currently down ( on the first 'close' event from the socket ).
 */
'offline' : function ( Object address )

/*
 * Client is trying to reconnect to Redis server, k is the number of current
 * connection attempt.
 *
 * NOTE: 'millis' indicates the last interval of time between attempts.
 */
'attempt' : function ( Number k, Number millis, Object address )

/*
 * The connection is definitively lost ( after opt.reconnection.trials times ).
 */
'lost' : function ( Object address )

/*
 * The socket times out for inactivity.
 * It only notifies that the socket has been idle.
 */
'timeout' : function ( Number timeout,  Object address )
```
_[Back to ToC](#table-of-contents)_

####PubSub Events

> __NOTE__: for multiple (__P__)(__UN__)__SUBSCRIBE__ commands, __callbacks are executed
> one time for every message reply__, those __messages__ will be received also through the _Pub/Sub_
> system. However the first callback signals that the command is succesfully processed by Redis.
>
> For example:
>  - __subscribe( [ 'a', 'a', 'b', 'b', 'c', 'c' ], cback )__ :
>    - executes callback __6__ times
>    - produces __6__ messages
>    - __3__ actual subscriptions
>  - __unsubscribe( null, cback )__:
>    - executes cback __3__ times
>    - produces __3__ messages
>    - __0__ subscriptions.

```javascript
/*
 * A message was received through the PubSub system when the client
 * is in PubSub mode.
 *
 * NOTE: the 'formatter' function converts the received 'message' to
 * an obj/hash.
 * For example, a message reply to a (P)(UN)SUBSCRIBE command issued
 * by the client, could be:
 *
 * 'message' -> [ 'unsubscribe', 'channel', 0 ]
 *
 * will be converted to:
 *
 * {
 *  type : 'unsubscribe'
 *  , chan : 'channel'
 *  . subs : 0
 * }
 *
 * a typical message received from publisher(s):
 *
 * 'message' -> [ 'message', 'channel', 'Hello folks!' ]
 *
 * will be converted to:
 *
 * {
 *  type : 'message'
 *  , chan : 'channel'
 *  . msg : 'Hello folks!!'
 * }
 *
 * See also Syllabus.formatters.
 *
 */
'message' : function ( Array message, Function formatter )

/*
 * An event to signal that the client is entering in PubSub mode after a
 * subscription command. From now, all replies to (un)subscription commands
 * will be received as messages.
 */
'listen' : function ()

/*
 * An event to signal that client is leaving PubSub mode after a successfull
 * execution of a unsubscription command.
 * It doesn't happen if the client disconnects while in PubSub mode.
 */
'shutup' : function ()
```
_[Back to ToC](#table-of-contents)_

####Monitor Events

```javascript
/*
 * A 'message' was received when the client is in Monitor mode.
 * 
 * NOTE: the 'formatter' function converts the 'message' to an obj/hash.
 * For example, with an input like:
 *
 * message = '1405478664.248185 [0 127.0.0.1:47573] "ping"',
 *
 * executing formatter( message ) will output:
 *
 * {
 *  ip: '127.0.0.1',
 *  port: 47573,
 *  db: 0,
 *  cmd: '"ping"',
 *  utime: 1405478664248,
 *  time: [ 1405478664, 248185 ]
 * }
 *
 * See also Syllabus.formatters.
 *
 */
'monitor' : function ( String message, Function formatter )
```
_[Back to ToC](#table-of-contents)_

####Tasks Events

> __NOTE__: to enable logging for events below, execute __Spade#initTasks__ method.

#####polling events

```javascript
/*
 * polling event will be emitted every time a reply for PING will be received.
 */
'polling' : function ( Number is_pubsub_active, Number is_monitor_active )

/*
 * When the client doesn't receive a reply within the timeout interval specified
 * with Spade.tasks.polling#run, it disconnects from server, and optionally
 * reconnects.
 */
'hangup' : function ( Number is_pubsub_active, Number is_monitor_active )
```

> See __[polling task](#polling-task)__.

####Other Debug Events

> __NOTE__: to enable logging for debug events , execute __[Spade#cli](#cli)__ method.

```javascript
/*
 * When the client is offline, commands are not sent but queued.
 */
'queued' : function ( Object command, Number offline_queue_size )

/*
 * When the client will be online once again, this event is emitted
 * before performing a scan for sending enqueued commands, then always
 * before the 'ready' event.
 */
'scanqueue' : function ( Number offline_queue_size )

/*
 * The client receives a command reply from Redis. It always happens after
 * the 'ready' event.
 */
'reply' : function ( Object command, String reply )

/*
 * The client receives an error reply from Redis. It always happens after
 * the 'ready' event.
 */
'error-reply' : function ( Object command, String err_reply )
```

#####iterators events

> __NOTE__: to enable logging for events below, execute also __Spade#loadIterators__ method.

```javascript
'scan' : function ( Boolean is_last_iter, Number iterations, Number keys_counter )
'hscan' : function ( Boolean is_last_iter, Number iterations, Number keys_counter, String key )
'sscan' : function ( Boolean is_last_iter, Number iterations, Number keys_counter, String key )
'zscan' : function ( Boolean is_last_iter, Number iterations, Number keys_counter, String key )
```
> See __[#loadIterators](#loaditerators)__.

_[Back to ToC](#table-of-contents)_

-------------------------------------------------------------------------------

### MIT License

> Copyright (c) 2015 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

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

[![GA](https://ga-beacon.appspot.com/UA-53998692-1/spade/Readme?pixel)](https://github.com/igrigorik/ga-beacon)