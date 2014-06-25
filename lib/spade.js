/*
 * ♠ Spade, a full-featured Redis client module, with offline queue
 * for commands, automatic socket reconnection and command rollback
 * mechanism for subscriptions and incomplete transactions, moreover,
 * it supports caching for LUA scripts.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Spade = ( function () {
    var log = console.log
        , emitter = require( 'events' ).EventEmitter
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , Cocker = require( 'cocker' )
        , Hiboris = require( 'hiboris' )
        , Libra = require( 'libra' )
        , Syllabus = require( 'syllabus' )
        , mix = Bolgia.mix
        , improve = Bolgia.improve
        , update = Bolgia.update
        , toString = Bolgia.toString
        , ooo = Bolgia.circles
        , emptyFn = function () {}
        // spade default opt
        , spade_opt = {
            /*
             * Syllabus develop option to restrict
             * commands to a particular Redis version.
             */
            semver : false
            /*
             * Cocker socket options
             */
            , socket : {
                address : {
                    host : '127.0.0.1'
                    , port : 6379
                }
                , reconnection : {
                    // Cocker default options..
                }
                , connection : {
                    // Cocker default options..
                }
            }
            , security : {
                '127.0.0.1:6379' : {
                    requirepass : 'foobared'
                    , mandatory : false
                }
            }
            , hiredis : false
        }
        , Spade = function ( opt ) {
            var me = this
                ;
            if ( ! ( me instanceof Spade ) ) {
                return new Spade( opt );
            }
            var cfg = improve( opt, spade_opt )
                , sopt = cfg.socket
                , semver = cfg.semver
                , hiboris = Hiboris( { hiredis : cfg.hiredis } )
                , cocker = Cocker( sopt )
                , libra = Libra()
                , syllabus = Syllabus( semver )
                , status = libra.status
                , lsub = status.subscription
                , lmon = status.monitoring
                // protocol parser match
                , onParserMatch = function ( err_reply, data, fn ) {
                    if ( me.auth ) {
                        me.auth.zn( err_reply, data, fn );
                        me.auth = null;
                        return;
                    }
                    var cmd = libra.pop()
                        , message = null
                        ;
                    if ( err_reply ) {
                        // execute command callback with -ERR reply
                        return cmd.zn( true, data, cmd.fn || fn );
                    }
                    // check pubsub subscriptions
                    if ( lsub.on ) {
                        message = fn( data );
                        // update current pubsub status
                        libra.update( message[ 0 ], message[ 2 ] );
                        /* 
                         * TODO NOTE: now execute command callback
                         * only for the first message reply.
                         */
                        if ( cmd ) cmd.zn( false, data, cmd.fn || fn );
                        me.emit( 'message', message );
                        return;
                    }
                    // check if monitoring
                    if ( lmon.on ) {
                        me.emit( 'monitor', fn( data ) );
                        return;
                    }
                    // execute command callback
                    cmd.zn( false, data, cmd.fn || fn );
                    // check if client is quitting connection
                    return cmd.isQuit ? cocker.bye() : null;
                }
                , onParserError = function ( err, data ) {
                    // build and emit a custom error object
                    me.emit( 'error', {
                        cmd : null
                        , data : data
                        , err : err
                    } );
                    // reset parser
                    hiboris.reset();
                    // reset connection, disconnect and reconnect
                    cocker.end();
                }
                , onConnectionLost = function ( address ) {
                    // reset libra status properties and its internal queue
                    libra.flush();
                    me.emit( 'lost', address );
                }
                , onConnectionOffline = function ( address ) {
                    me.ready = false;
                    // do rollback if rollUp is active
                    libra.rollBack();
                    me.emit( 'offline', address );
                }
                , processCommandQueue = function ( address ) {
                    // permit cache to be re-initialized when online
                    me.cacheready = true;
                    // iterate on queue if it's not empty
                    libra.iterate( function ( el, i, done ) {
                        cocker.write( el.ecmd );
                        done();
                    }, me, function ( err, cnt ) {
                        // final callback
                        me.ready = true;
                        me.emit( 'ready', address );
                    } );
                }
                , sendAuth = function ( address, password ) {
                    me.auth = syllabus.encode( 'AUTH', password, null, function ( err, data, fn ) {
                        if ( err ) {
                            /*
                             * AUTH error reply. Command queue will not be processed;
                             * it also happens when an AUTH command was sent, but the
                             * password is not required by Redis.
                             */
                            me.emit( 'authfailed', address, password, fn( data ) );
                            // disconnect from server also to force AUTH on re-connection
                            return cocker.bye();
                        }
                        processCommandQueue( address );
                    } );
                    // write to socket
                    return cocker.write( me.auth.ecmd );
                }
                , onConnectionEstablished = function ( address ) {
                    var key = address.host + ':' + address.port
                        , osec = me.options.security
                        , security = osec[ key ]
                        , password = security && security.mandatory ? security.requirepass : null
                        ;
                    /*
                     * If authorization is not mandatory for the current host, then immediately
                     * process the command queue; otherwise, set the authorization property,
                     * encoding the AUTH command with relative password.
                     */
                    return password ? sendAuth( address, password ) : processCommandQueue( address );
                    
                }
                , onConnectionReadable = function () {
                    var data = cocker.read();
                    // log( 'cocker on readable data: %j', data + '' );
                    if ( data ) {
                        hiboris.parse( data );
                    }
                }
                , onReconnectionAttempt = function ( k, addr, ms ) {
                    me.emit( 'attempt', k, addr, ms );
                }
                // send a command
                , send = function ( ocmd ) {
                    // check first for command encoding error from Syllabus mix-in
                    if ( ocmd.err ) {
                        return me.emit( 'error', ocmd );
                    }
                    // push command to queue
                    libra.push( ocmd );
                    // if ready write to socket
                    if ( me.ready ) {
                        cocker.write( ocmd.ecmd );
                    }
                }
                , onConnectionTimeout = function () {
                    var scfg = me.options.socket
                        ;
                    me.emit( 'timeout', scfg.address, scfg.connection.timeout );
                }
                ;

            // parser error
            hiboris.on( 'error', onParserError );
            // parser returns some data
            hiboris.on( 'match', onParserMatch );

            // client connection is definitively lost
            cocker.on( 'lost', onConnectionLost );
            // client connection is down
            cocker.on( 'offline', onConnectionOffline );
            // client connection is fully established
            cocker.on( 'online', onConnectionEstablished );
            // cocker reconnection attempt
            cocker.on( 'attempt', onReconnectionAttempt );
            // socket is readable
            cocker.on( 'readable', onConnectionReadable );
            // socket times out
            cocker.on( 'timeout', onConnectionTimeout );

            // wrap syllabus commands
            syllabus.wrap( send );

            // wrap syllabus lua scripts/commands
            syllabus.lua.wrap( send );

            // set some internal properties
            me.options = cfg;
            me.ready = false;
            me.cacheready = true;
            /*
             * Current encoded AUTH command, this property will be set
             * if authentication is mandatory for the current address.
             * When auth is required, the first command sent to Redis,
             * should be AUTH.
             */
            me.auth = null;

            // modules shortcuts
            me.socket = cocker;
            me.parser = hiboris;
            me.queue = libra;
            me.mixins = syllabus;

            // syllabus commands shortcut
            me.commands = syllabus.commands;

            // syllabus scripts shortcut
            me.lua = syllabus.lua;

        }
        , sproto = null
        ;

    util.inherits( Spade, emitter );

    sproto = Spade.prototype;

    sproto.connect = function ( opt, cback ) {
        var me = this
           , next = toString( cback ) === ooo.fun ? cback : emptyFn
           , sopt = update( me.options.socket, opt )
           ;
        me.once( 'ready', next );
        me.socket.run( sopt );
        return me;
    };

    sproto.disconnect = function ( cback ) {
        var me = this
            , next = toString( cback ) === ooo.fun ? cback : emptyFn
            , cocker = me.socket
            ;
        cocker.once( 'close', next );
        cocker.bye();
        return me;
    };

    sproto.initCache = function ( file_load_opt, cache_init_opt ) {
        var me = this
            , lua = me.lua
            , libra = me.queue
            , cocker = me.socket
            ;
        /*
         * If the client is offline and the cache is already
         * loading scripts, return immediately to avoid pushing
         * multiple SCRIPT LOAD to the command queue.
         */
        if ( ! me.ready && ! me.cacheready ) return;
        /*
         * Disable #initCache as long as all scripts
         * will be loaded/processed by Redis.
         */
        me.cacheready = false;
        // init Camphora cache loading LUA scripts
        lua.init( function ( clist ) {
            me.emit( 'cacheinit', clist );
            clist.forEach( function ( ocmd, i, list ) {
                // check first for command encoding error from Syllabus mix-in.
                if ( ocmd.err ) {
                    return me.emit( 'error', ocmd );
                }
                // push command to queue
                libra.push( ocmd );
                // if ready write to socket
                if ( me.ready ) {
                    cocker.write( ocmd.ecmd );
                }
            } );
        }, function ( is_error_reply, script, data, txt, isLast ) {
            if ( is_error_reply ) {
                // a script was sent, processed and refused by Redis
                me.emit( 'scriptfailure', script, data );
            } else {
                // a script was successfully sent and processed by Redis
                me.emit( 'cacheload', script, data, txt );
            }
            if ( isLast ) {
                // all LUA scripts are sent and processed by Redis.
                me.cacheready = true;
                me.emit( 'cacheready', lua.cache );
            }
        /*
         * pass file loading and cache options, if 'cache_init_opt'
         * is set, cache will be re-initialized.
         */
        }, file_load_opt, cache_init_opt );
    };

    return Spade;
} )();