/*
 * ♠ Spade, a full-featured Redis client module, with offline queue
 * for commands, automatic socket reconnection and command rollback
 * mechanism for subscriptions and incomplete transactions.
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
        , Boris = require( 'boris' )
        , Cocker = require( 'cocker' )
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
                    host : 'localhost'
                    , port : 6379
                }
                , reconnection : {
                    trials : 3
                    , interval : 1000
                }
            }
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
                , boris = Boris()
                , cocker = Cocker( sopt )
                , libra = Libra()
                , syllabus = Syllabus( semver )
                , status = libra.status
                , lsub = status.subscription
                , lmon = status.monitoring
                // protocol parser match
                , onParserMatch = function ( err_reply, data, fn ) {
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
                , onConnectionEstablished = function ( address ) {
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
                , onConnectionReadable = function () {
                    var data = cocker.read();
                    // log( 'cocker on readable data: %j', data + '' );
                    if ( data ) {
                        boris.parse( data );
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
                ;

            // wrap syllabus commands
            syllabus.wrap( send );

            // parser error
            boris.on( 'error', onParserError );
            // parser returns some data
            boris.on( 'match', onParserMatch );

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

            // set some internal properties
            me.options = cfg;
            me.ready = false;

            // modules shortcuts
            me.cocker = cocker;
            me.libra = libra;
            me.syllabus = syllabus;

            // syllabus command shortcut
            me.commands = syllabus.commands;
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
        me.cocker.once( 'online', next );
        me.cocker.run( sopt );
        return me;
    };

    sproto.disconnect = function ( cback ) {
        var me = this
            , next = toString( cback ) === ooo.fun ? cback : emptyFn
            ;
        me.cocker.once( 'close', next );
        me.cocker.bye();
        return me;
    };

    return Spade;
} )();