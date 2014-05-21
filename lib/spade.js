/*
 * Spade, a Redis 2.x Client.
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
        , Train = require( 'train' )
        , mix = Bolgia.mix
        , improve = Bolgia.improve
        , update = Bolgia.update
        , toString = Bolgia.toString
        , ooo = Bolgia.circles
        // wrap syllabus commands
        , wrap = function ( obj, fn ) {
            var hash = toString( obj ) === ooo.obj ? obj : {}
                , eat = toString( fn ) === ooo.fun ? fn : function ( v ) { return v; }
                , h = null
                ;
            for ( h in hash ) {
                if ( toString( hash[ h ] ) === ooo.obj ) {
                    wrap( hash[ h ], eat );
                    continue;
                }
                hash[ h ] = ( function ( f ) {
                    return function () {
                        eat( f.apply( f, arguments ) );
                    };
                } )( hash[ h ] );
            };
        }
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
                , lsub = libra.status.subscription
                , lmon = libra.status.monitoring
                , syllabus = Syllabus()
                // send a command
                , send = function ( ocmd ) {
                    // check for command error
                    if ( ocmd.err ) {
                        return me.emit( 'error', ocmd );
                    }
                    if ( ! me.ready ) {
                        // if client is offline return without pushing cmd to queue
                        libra.push( ocmd );
                        return;
                    }
                    if ( ! lsub.on || ocmd.isQuit ) {
                        // push command to the queue, and write to socket
                        libra.push( ocmd );
                    }
                    cocker.write( ocmd.ecmd );
                }
                ;

            // wrap syllabus commands
            wrap( syllabus.commands, send );

            boris.on( 'error', function ( err, data ) {
                // build and emit a custom error object
                me.emit( 'error', {
                    cmd : null
                    , data : data
                    , err : err
                } );
            } );

            boris.on( 'match', function ( err_reply, data, fn ) {
                var cmd = libra.pop()
                    , channels = 0
                    , result = null
                    , sub = null
                    , psub = null
                    ;
                if ( cmd ) {
                    // log( 'boris on match data: %j', data + '', cmd );
                    cmd.zn( err_reply, data, cmd.fn );
                    // check if client is quitting connection
                    if ( cmd.isQuit ) {
                        lsub.on = false;
                        lmon.on = false;
                        cocker.bye();
                    }
                    return;
                }
                if ( lsub.on ) {
                    result = fn( data );
                    cmd = result[ 0 ];
                    channels = result[ 2 ];
                    sub = ( cmd === 'subscribe' ) || ( cmd === 'unsubscribe' );
                    psub = ( cmd === 'psubscribe' ) || ( cmd === 'punsubscribe' );
                    if ( sub ) {
                        lsub.channels = channels;
                    } else if ( psub ) {
                        lsub.pchannels = channels;
                    }
                    lsub.on = !! ( lsub.channels + lsub.pchannels );
                    me.emit( 'message', result );
                    return;
                }
                if ( lmon.on ) {
                    result = fn( data );
                    me.emit( 'monitor', result );
                    return;
                }
            } );

            cocker.on( 'lost', function ( address ) {
                // reset libra status properties and queue
                libra.flush();
                me.emit( 'lost', address );
            } );

            cocker.on( 'offline', function ( address ) {
                me.ready = false;
                // check transaction rollback
                if ( libra.cqueue.roll ) {
                    libra.cqueue.rollBack();
                }
                me.emit( 'offline', address );
            } );

            cocker.on( 'online', function ( address ) {
                if ( libra.cqueue.size() ) {
                    libra.cqueue.iterate( function ( el, i, done ) {
                            cocker.write( el.ecmd );
                            done();
                        }, me, function ( err, cnt ) {
                            // final callback
                            me.ready = true;
                            me.emit( 'ready', address );
                    } );
                    return;
                }
                me.ready = true;
                me.emit( 'ready', address );
            } );

            cocker.on( 'readable', function () {
                var data = cocker.read();
                if ( data ) {
                    // log( 'cocker on readable data: %j', data + '' );
                    boris.parse( data );
                }
            } );

            me.ready = false;
            // some shortcuts
            me.cocker = cocker;
            me.libra = libra;
            me.syllabus = syllabus;
            me.commands = syllabus.commands;
            me.options = cfg;

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