/*
 * ♠ Spade, a full-featured, nulti-modular Redis client, with offline queue
 * for commands, automatic socket reconnection and command rollback mechanism
 * for subscriptions and incomplete transactions, moreover, it supports caching
 * for LUA scripts.
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
        , inspect = util.inspect
        , mix = Bolgia.mix
        , improve = Bolgia.improve
        , update = Bolgia.update
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , ostr = ooo.str
        , onum = ooo.num
        , emptyFn = function () {}
        // spade default opt
        , spade_opt = {
            /*
             * Syllabus develop option to restrict
             * commands to a particular Redis version.
             */
            semver : null
            /*
             * Cocker socket options
             */
            , socket : {
                path : null
                , address : {
                    // Redis default address 
                    host : '127.0.0.1'
                    , port : 6379
                    , family : 'Ipv4'
                }
                , reconnection : {
                    // Cocker default options..
                }
                , connection : {
                    // Cocker default options..
                }
            }
            , security : {
                // a network path (ip:port)
                '127.0.0.1:6379' : {
                    requirepass : ''
                    /*
                     * -1 disable sending of SELECT db
                     * command, on client reconnection.
                     */
                    , db : 0
                }
                // a unix domain socket path
                , '/tmp/redis.sock' : {
                    requirepass : ''
                    , db : 0
                }
            }
            , hiredis : false
        }
        // events for CLI logging
        , events = [
            'error'
            ,'connect'
            , 'offline'
            , 'attempt'
            , 'lost'
            , 'ready'
            , 'cacheinit'
            , 'cacheload'
            , 'scriptfailure'
            , 'cacheready'
            , 'authfailed'
            , 'authorized'
            , 'dbfailed'
            , 'dbselected'
            , 'monitor'
            , 'message'
            , 'listen'
            , 'shutup'
            // debug events
            , 'queued'
            , 'scanqueue'
            , 'reply'
        ]
        , Spade = function ( opt ) {
            var me = this
                ;
            if ( ! ( me instanceof Spade ) ) {
                return new Spade( opt );
            }
            var cfg = improve( opt, spade_opt )
                , sopt = cfg.socket
                , semver = cfg.semver
                // when using hiredis parser, returning buffers will slowdown of aboout -60%
                , hiboris = Hiboris( { hiredis : cfg.hiredis, return_buffers : false } )
                , cocker = Cocker( sopt )
                , libra = Libra()
                , syllabus = Syllabus( semver )
                , formatters = syllabus.formatters
                , status = libra.status
                , lsub = status.subscription
                , lmon = status.monitoring
                // protocol parser match
                , onParserMatch = function ( err_reply, data, fn ) {
                    // get queue head
                    var cmd = null
                        , message = null
                        , subs = 0
                        , cli_debug = me.cli_debug
                        , llen = cli_debug.length
                        , mtype = null
                        , msubs = null
                        // process message reply to a subscription command
                        , getReplyMessages = function () {
                            /*
                             * NOTE: the callback for a multiple (un)subscriptions
                             * command is executed only for the first reply received,
                             * when the command is succesfully processed by Redis then
                             * all command replies will be received as messages.
                             */
                            message = fn( data )
                            mtype = message[ 0 ];
                            msubs = message[ 2 ];
                            // update current pubsub status
                            if ( libra.subs() ) {
                                libra.update( mtype, msubs );
                                cmd.zn( err_reply, data, cmd.fn || fn );
                                return me.emit( 'message', message, formatters.message );
                            }
                            // no active subscriptions in client status property
                            subs = libra.update( mtype, msubs );
                            cmd.zn( err_reply, data, cmd.fn || fn );
                            if ( subs ) me.emit( 'listen' );
                            return me.emit( 'message', message, formatters.message );
                        }
                        , getMessage = function () {
                            // check message type
                            message = fn( data )
                            mtype = message[ 0 ];
                            if ( mtype === 'message' ) {
                                return me.emit( 'message', message, formatters.message );
                            }
                            // peek head command
                            cmd = libra.head();
                            if ( ! cmd ) {
                                // command is undefined, message or "OK" reply to QUIT.
                                msubs = message[ 2 ];
                                // update current pubsub status
                                subs = libra.update( mtype, msubs );
                                // if returns -1 then disconnect
                                if ( ~ subs ) {
                                    me.emit( 'message', message, formatters.message );
                                    if ( subs === 0 ) me.emit( 'shutup' );
                                } else cocker.bye();
                                return;
                            }
                            cmd = libra.pop();
                            // command could be a subscription.
                            return cmd.isSubscription ? getReplyMessages() : null;
                        }
                        , getMonitorMessage = function () {
                            // if cmd.isMonitor then execute callback else emit 'monitor'
                            message = fn( data );
                            return cmd && cmd.isMonitor ?
                                   cmd.zn( false, data, cmd.fn || fn ) :
                                   me.emit( 'monitor', message, formatters.monitor )
                                   ;
                        }
                        , getReply = function ( is_err ) {
                            var e = !! is_err
                                ;
                            cmd.zn( e, data, cmd.fn || fn );
                            // if logging is active, emit 'reply'
                            if ( llen ) me.emit( 'reply', e, cmd, ( cmd.fn || fn )( data ) );
                            // check if the client is quitting connection
                            return cmd.isQuit ? cocker.bye() : null;
                        }
                        ;
                    /*
                     * If PubSub mode is currently active, get the message but don't pop command
                     * immediately, check for first if it's a message reply to a (un)subscription
                     * command or a simple message received from PubSub system.
                     */
                    if ( lsub.active && ! err_reply ) return getMessage();
                    // pop command from queue
                    cmd = libra.pop();
                    if ( err_reply ) return getReply( true );
                    // check if monitor mode is active
                    if ( lmon.active ) return getMonitorMessage();
                    // check if command is a subscription
                    if ( cmd.isSubscription ) return getReplyMessages();
                    // execute command callback for all other commands
                    return getReply();
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
                    if ( me.cli_debug.length ) me.emit( 'scanqueue', libra.cqueue.size() );
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
                , onConnectionEstablished = function ( address ) {
                    var opt = me.options
                        , path = opt.socket.path
                        , key = path && doString( path.fd ) === ostr ? path.fd : address.host + ':' + address.port
                        , osec = opt.security
                        , security = osec[ key ]
                        , password = security && doString( security.requirepass ) === ostr ? security.requirepass : null
                        , db = security ? security.db : 0
                        ;
                    // bubble up socket 'connect' event.
                    me.emit( 'connect', address );
                    /*
                     * If authorization is not mandatory for the current host, then immediately
                     * process the command queue; otherwise, set the authorization property,
                     * encoding the AUTH command with relative password.
                     */
                    return password ?
                           sendAuth( address, password, db ) :
                           ~ db ? sendSelect( address, db ) : processCommandQueue( address );
                }
                , onConnectionReadable = function () {
                    var data = cocker.read()
                        ;
                    if ( data ) {
                        hiboris.parse( data );
                    }
                }
                , onReconnectionAttempt = function ( k, addr, ms ) {
                    me.emit( 'attempt', k, ms, addr );
                }
                , onConnectionTimeout = function () {
                    var scfg = me.options.socket
                        ;
                    me.emit( 'timeout', scfg.connection.timeout, scfg.address );
                }
                // send an encoded command
                , send = function ( ocmd ) {
                    // check first for command encoding error from Syllabus mix-in
                    if ( ocmd.err ) {
                        return me.emit( 'error', ocmd );
                    }
                    // push command to the queue, if no error occurs.
                    if ( ~ libra.push( ocmd ) ) {
                        // if client is ready, then write to socket.
                        return me.ready ?
                               cocker.write( ocmd.ecmd ) :
                               me.cli_debug.length ? me.emit( 'queued', ocmd, libra.cqueue.size() ) : null
                               ;
                    }
                    // command is not allowed and wasn't pushed to queue
                    me.emit( 'error', ocmd );
                }
                /*
                 * Send AUTH command before any other command on new connection.
                 * On AUTH error reply, the command queue will not be processed;
                 * it also happens when an AUTH command was sent, but the password
                 * is not required by Redis. The client will disconnects from server
                 * to force the sending of another AUTH command on re-connection.
                 */
                , sendAuth = function ( address, password, db ) {
                    var encode = syllabus.encode
                        , onAuthReply = function ( err, data, fn ) {
                            var reply = fn( data )
                                ;
                            if ( err ) {
                                me.emit( 'authfailed', password, reply, address );
                                return cocker.bye();
                            }
                            me.emit( 'authorized', password, reply, address );
                            // when db === -1, on reconnection send no SELECT.
                            return ~ db ? processCommandQueue( address ) : sendSelect( address, db );
                        }
                        , auth = encode( 'AUTH', password, null, onAuthReply );
                    // set special command shortcut
                    auth.isAuth = 1;
                    // signal/push special AUTH command to the command queue
                    libra.auth( auth );
                    // write to socket
                    return cocker.write( auth.ecmd );
                }
                /*
                 * Send SELECT db command as the first command on new connection (after AUTH).
                 * On SELECT error reply, the command queue will not be processed. The client will
                 * disconnects from server to force the sending of another SELECT command on
                 * re-connection (after AUTH).
                 */
                , sendSelect = function ( address, index ) {
                    var encode = syllabus.encode
                        // normalize db index argument, it returns 0 if index is not valid
                        , db = doString( index ) === onum ? Math.abs( index ) : +index ? +index : 0
                        , onSelectReply = function ( err, data, fn ) {
                            var reply = fn( data )
                                ;
                            if ( err ) {
                                me.emit( 'dbfailed', db, reply, address );
                                return cocker.bye();
                            }
                            me.emit( 'dbselected', db, reply, address );
                            processCommandQueue( address );
                        }
                        , select = encode( 'SELECT', db, null, onSelectReply );
                    // set special command shortcut
                    select.isSelect = 1;
                    // signal/push special SELECT command to the command queue
                    libra.select( select );
                    // write to socket
                    return cocker.write( select.ecmd );
                }
                // utility to add user defined options for address to security hash
                , add_security_entry = function () {
                    var opt = me.options
                        , sec_opt = opt.security
                        , sock_opt = opt.socket
                        , addr_opt = sock_opt.path || ( sock_opt.address.host + ':' + sock_opt.address.port )
                        , sopt = sec_opt[ addr_opt ] || ( sec_opt[ addr_opt ] = { requirepass : '', db : 0 } )
                        ;
                    return sopt;
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

            // collect listeners for CLI logging
            me.cli_debug = [];

            /*
             * Add security entry for socket.address or socket.path, 
             * defined in the constructor options.
             */
            add_security_entry();
        }
        , sproto = null
        ;

    util.inherits( Spade, emitter );

    sproto = Spade.prototype;

    sproto.connect = function ( opt, cback ) {
        var me = this
           , sopt = update( me.options.socket, opt || {} )
           , next = doString( cback ) === ooo.fun ? cback : emptyFn
           ;
        me.once( 'ready', next );
        me.socket.run( sopt );
        return me;
    };

    sproto.disconnect = function ( cback ) {
        var me = this
            , cocker = me.socket
            , next = doString( cback ) === ooo.fun ? cback : emptyFn
            ;
        cocker.once( 'close', next );
        cocker.bye();
        return me;
    };

    sproto.initCache = function ( file_load_opt, cache_init_opt, cback ) {
        var me = this
            , lua = me.lua
            , libra = me.queue
            , cocker = me.socket
            , next = doString( cback ) === ooo.fun ? cback : emptyFn
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
        // initialize Camphora cache with LUA scripts
        lua.init( function ( clist ) {
            me.emit( 'cacheinit', clist );
            clist.forEach( function ( ocmd, i, list ) {
                // check first for command encoding error from Syllabus mix-in.
                if ( ocmd.err ) {
                    return me.emit( 'error', ocmd );
                }
                // push command to the queue, if no error occurs.
                if ( ~ libra.push( ocmd ) ) {
                    // if client is ready, then write to socket.
                    return me.ready ? cocker.write( ocmd.ecmd ) : null;
                }
                // command is not allowed and wasn't pushed to queue
                me.emit( 'error', ocmd );
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
                next( lua.cache );
                me.emit( 'cacheready', lua.cache );
            }
        /*
         * pass file loading and cache options, if 'cache_init_opt'
         * is set, cache will be re-initialized.
         */
        }, file_load_opt, cache_init_opt );
    };

    sproto.cli = function ( enable, fn ) {
        var me = this
            , remove = me.removeListener
            , slice = Array.prototype.slice
            , cli_debug = me.cli_debug
            , llen = cli_debug.length
            , elen = events.length
            , ok = enable === undefined ? true : enable
            , lback = typeof fn === 'function' ? fn : function ( ename, args ) {
                log( '!%s: %s', ename, inspect( args, false, 3, true ) );
            }
            , clog = function ( ename ) {
                var logFn = function () {
                    lback( ename, slice.call( arguments ) );
                };
                cli_debug.push( ename, logFn );
                me.on( ename, logFn );
            }
            , i = 0
            ;
        if ( ok ) {
            if ( llen ) return;
            for ( ; i < elen; ++i ) clog( events[ i ] );
            return;
        }
        i = 0;
        // remove all listeners for logging
        for ( ; i < llen - 1; i += 2 ) me.removeListener( cli_debug[ i ], cli_debug[ i + 1 ] );
        me.cli_debug = [];
    };

    return Spade;
} )();