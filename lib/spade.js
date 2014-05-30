/*
 * ♠ Spade , a Redis 2.x Client.
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
        // spade default opt
        , spade_opt = {
            // Cocker socket options
            socket : {
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
                , boris = Boris()
                , cocker = Cocker( sopt )
                , libra = Libra()
                , syllabus = Syllabus()
                , status = libra.status
                , lsub = status.subscription
                , lmon = status.monitoring
                // on protocol paser match
                , onMatch = function ( err_reply, data, fn ) {
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
            boris.on( 'error', function ( err, data ) {
                // build and emit a custom error object
                me.emit( 'error', {
                    cmd : null
                    , data : data
                    , err : err
                } );
            } );
            // parser returns some data
            boris.on( 'match', onMatch );
            // client connection is definitively lost
            cocker.on( 'lost', function ( address ) {
                // reset libra status properties and its internal queue
                libra.flush();
                me.emit( 'lost', address );
            } );
            // client connection is down
            cocker.on( 'offline', function ( address ) {
                me.ready = false;
                // do rollback if rollUp is active
                libra.rollBack();
                me.emit( 'offline', address );
            } );
            // client connection is fully established
            cocker.on( 'online', function ( address ) {
                // iterate on queue if it's not empty
                libra.iterate( function ( el, i, done ) {
                    cocker.write( el.ecmd );
                    done();
                }, me, function ( err, cnt ) {
                    // final callback
                    me.ready = true;
                    me.emit( 'ready', address );
                } );
            } );
            // socket is readable
            cocker.on( 'readable', function () {
                var data = cocker.read();
                // log( 'cocker on readable data: %j', data + '' );
                if ( data ) {
                    boris.parse( data );
                }
            } );
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

    // TODO - handle multiple connection calls?
    sproto.connect = function ( opt ) {
        var me = this
            , sopt = update( me.options.socket, opt )
            ;
        me.cocker.run( sopt );
        return me;
    };

    return Spade;
} )();