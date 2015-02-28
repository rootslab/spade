/*
 * ♠ Spade, a robust, full-featured, multi-modular Redis client, with offline queue
 * for commands, automatic socket reconnection and command rollback mechanism
 * for subscriptions, moreover, it supports caching for LUA scripts.
 *
 * Copyright(c) 2015 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Spade = ( function () {
    var emitter = require( 'events' ).EventEmitter
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , Cocker = require( 'cocker' )
        , Hiboris = require( 'hiboris' )
        , Libra = require( 'libra' )
        , Syllabus = require( 'syllabus' )
        , Cucu = require( 'cucu' )
        , Gerry = require( 'gerry' )
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , update = Bolgia.update
        , doString = Bolgia.doString
        , ooo = Bolgia.circles
        , ostr = ooo.str
        , ofun = ooo.fun
        , onum = ooo.num
        , abs = Math.abs
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
                    , family : null
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
            // native parser
            , hiredis : false
            // command queue options
            , queue : {
                timestamps : false
                , rollback : 64 * 1024
            }
        }
        , emsg_unexp = 'Unexpected reply from Redis, connection will be resetted.'
        // events for CLI logging
        , events = [
            'error'
            ,'connect'
            , 'offline'
            , 'attempt'
            , 'lost'
            , 'ready'
            , 'timeout'
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
            , 'error-reply'
        ]
        , Spade = function ( opt ) {
            var me = this
                , is = me instanceof Spade
                ;
            if ( ! is ) return new Spade( opt );

            var cfg = improve( clone( opt ), spade_opt )
                , sopt = cfg.socket
                , qopt = cfg.queue
                , semver = cfg.semver
                // when using hiredis parser, returning buffers will slowdown of aboout -60%
                , hiboris = Hiboris( { hiredis : cfg.hiredis, return_buffers : false } )
                , cocker = Cocker( sopt )
                , cucu = Cucu()
                , gerry = Gerry( me, events )
                , libra = Libra( qopt )
                , syllabus = Syllabus( semver )
                , lstatus = libra.status
                , lsub = lstatus.subscription
                , lmon = lstatus.monitoring
                , formatters = syllabus.formatters
                , elist = gerry.events
                // protocol parser match
                , onParserMatch = function ( err_reply, data, fn ) {
                    // get queue head
                    var cmd = null
                        , message = null
                        , mtype = null
                        , msubs = null
                        , csubs = null
                        , subs = 0
                        , elen = elist.length
                        // process message reply to a (p)(un)subscription command
                        , getReplyMessages = function ( err_reply ) {
                            // pop command from queue
                            libra.pop();
                            // get message reply
                            message = fn( data );
                            mtype = message[ 0 ];
                            msubs = message[ 2 ];
                            csubs = libra.subs();
                            // update current pubsub status
                            subs = libra.update( mtype, msubs );
                            // emit listen only if the client is actually entered in PubSub mode
                            if ( ! csubs && ( csubs !== subs ) ) me.emit( 'listen' );
                            cmd.zn( err_reply, data, cmd.fn );
                            me.emit( 'message', message, formatters.message );
                            if ( subs === 0 && csubs !== 0 ) me.emit( 'shutup' );
                        }
                        , getReply = function () {
                            libra.pop();
                            // if logging is active, emit 'reply'
                            if ( elen ) me.emit( err_reply ? 'error-reply' : 'reply', cmd, data, cmd.fn || fn );
                            // execute callback
                            cmd.zn( err_reply, data, cmd.fn );
                            // check if the client is quitting connection
                            return cmd.isQuit ? cocker.bye() : null;
                        }
                        , getMessage = function () {
                            // get message reply
                            message = fn( data );
                            // check message type
                            mtype = message[ 0 ];
                            // check for message and pmessage
                            // get the message and don't pop command
                            if ( ~ mtype.indexOf( 'message' ) ) return me.emit( 'message', message, formatters.message );
                            if ( ! cmd ) {
                                // command is undefined, a message was received
                                msubs = message[ 2 ];
                                // update current pubsub status
                                subs = libra.update( mtype, msubs );
                                me.emit( 'message', message, formatters.message );
                                return subs === 0 ? me.emit( 'shutup' ) : null;
                            } 
                            // command could be a subscription, then a message reply to a (un)subscription
                            return cmd.isSubscription ? getReplyMessages() : getReply();
                        }
                        ;
                    // peek queue head, then if it is a QUIT command, return reply
                    if ( ( cmd = libra.head() ) && cmd.isQuit ) return getReply();
                    // check if monitor mode is active
                    if ( lmon.active ) return me.emit( 'monitor', fn( data ), formatters.monitor );
                    // check if pubsub mode is active
                    if ( lsub.active ) return getMessage();
                    // if command doesn't exist, emit an error
                    return ! cmd ?
                           onParserError( new Error( emsg_unexp ), fn( data ) ) :
                           // else check if command is a subscription
                           cmd.isSubscription ? getReplyMessages() : getReply()
                           ;
                }
                , onParserError = function ( err, data ) {
                    // build and emit a custom error object
                    me.emit( 'error', {
                        cmd : null
                        , data : data
                        , err : err
                    } );
                    // reset connection (then also parser on offline), disconnect and reconnect
                    cocker.end();
                }
                , onConnectionLost = function ( address ) {
                    // reset libra status properties and its internal queue
                    libra.flush();
                    me.emit( 'lost', address );
                }
                , onConnectionOffline = function ( address ) {
                    me.ready = false;
                    // reset parser
                    hiboris.reset();
                    // reset queue status for subscriptions and transactions
                    libra.reset();
                    // do rollback if rollUp is active
                    libra.rollBack();
                    me.emit( 'offline', address );
                }
                , processCommandQueue = function ( address ) {
                    // permit cache to be re-initialized when online
                    me.cacheready = true;
                    if ( gerry.events.length ) me.emit( 'scanqueue', libra.cqueue.size() );
                    // iterate on queue if it's not empty
                    libra.iterate( function ( el, i, done ) {
                        cocker.write( el.ecmd );
                        done();
                    }, me, function ( err, cnt ) {
                        // final callback
                        me.ready = true;
                        me.emit( 'ready', address, cnt );
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
                    if ( data ) hiboris.parse( data );
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
                    if ( ocmd.err ) return me.emit( 'error', ocmd );
                    // push command to the queue, if no error occurs.
                    if ( ~ libra.push( ocmd ) ) return me.ready ?
                        // if client is ready, then write to socket.
                        cocker.write( ocmd.ecmd ) :
                        gerry.events.length ? me.emit( 'queued', ocmd, libra.cqueue.size() ) : null
                        ;
                    // command is not allowed and wasn't pushed to queue, set dumb data to error message.
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
                            return ~ db ? sendSelect( address, db ) : processCommandQueue( address );
                        }
                        , auth = encode( 'AUTH', password, null, onAuthReply )
                        ;
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
                        // normalize db index argument, it returns 0 if index is not valid (NaN)
                        , db = ( doString( + index ) === onum ) ? abs( + index ) : 0
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
                        , select = encode( 'SELECT', db, null, onSelectReply )
                        ;
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

            // modules shortcuts
            me.socket = cocker;
            // RESP parser
            me.parser = hiboris;
            // command queue
            me.queue = libra;
            // commands mix-ins and cache
            me.mixins = syllabus;
            // task manager
            me.qq = cucu;
            // event manager for CLI logging
            me.logger = gerry;

            // Cucu tasks table shortcut
            me.tasks = cucu.ttable;
            // syllabus commands shortcut
            me.commands = syllabus.commands;
            // iterators enabled by #loadIterators method
            me.iterators = {};

            // syllabus scripts shortcut
            me.lua = syllabus.lua;

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

    sproto.cli = function ( enable, fn, collect ) {
         var me = this
            , mfn = enable === undefined || enable === null ? 'enable' : !! enable ? 'enable' : 'disable'
            ;
        me.logger[ mfn ]( collect, fn );
        return me;
    };

    sproto.connect = function ( opt, cback ) {
        var me = this
           , sopt = update( me.options.socket, opt || {} )
           , next = doString( cback ) === ofun ? cback : emptyFn
           ;
        me.once( 'ready', next );
        me.socket.run( sopt );
        return me;
    };

    sproto.disconnect = function ( cback ) {
        var me = this
            , cocker = me.socket
            , next = doString( cback ) === ofun ? cback : emptyFn
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
            , next = doString( cback ) === ofun ? cback : emptyFn
            ;
        /*
         * If the client is offline and the cache is already
         * loading scripts, return immediately to avoid pushing
         * multiple SCRIPT LOAD to the command queue.
         */
        if ( ! me.ready && ! me.cacheready )
            return next( new Error( 'cache is already initializing' ) );
        /*
         * Disable #initCache as long as all scripts
         * will be loaded/processed by Redis.
         */
        me.cacheready = false;
        // initialize Camphora cache with LUA scripts
        lua.init( function ( clist ) {
            me.emit( 'cacheinit', clist );
            clist.forEach( function ( ocmd ) {
                // check first for command encoding error from Syllabus mix-in.
                if ( ocmd.err ) return me.emit( 'error', ocmd );
                // push command to the queue, if no error occurs.
                // if client is ready, then write to socket.
                if ( ~ libra.push( ocmd ) ) return me.ready ? cocker.write( ocmd.ecmd ) : null;
                // command is not allowed and wasn't pushed to queue
                me.emit( 'error', ocmd );
            } );
        }, function ( is_error_reply, script, data, txt, isLast ) {
            // a script was sent, processed and refused by Redis
            if ( is_error_reply ) me.emit( 'scriptfailure', script, data );
            // a script was successfully sent and processed by Redis
            else me.emit( 'cacheload', script, data, txt );
            if ( isLast ) {
                // all LUA scripts are sent and processed by Redis.
                me.cacheready = true;
                next( null, lua.cache );
                me.emit( 'cacheready', lua.cache );
            }
        /*
         * pass file loading and cache options, if 'cache_init_opt'
         * is set, cache will be re-initialized.
         */
        }, file_load_opt, cache_init_opt );
    };

    sproto.initTasks = function ( file_names ) {
        var me = this
            ;
        require( './tasks/' )( me, file_names );
        return me.tasks;
    };

    sproto.loadIterators = function ( file_names ) {
        var me = this
            ;
        require( './iterators/' )( me, file_names );
        return me.iterators;
    };

    return Spade;

} )();