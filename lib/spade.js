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
        wrap = function ( obj, fn ) {
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
                        return eat( f.apply( f, arguments ) );
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
                , syllabus = Syllabus()
                // send a command
                , send = function ( ocmd ) {
                    // push command to the queue, and write to socket
                    me.libra.push( ocmd );
                    me.cocker.write( ocmd.ecmd );
                }
                ;
            // wrap syllabus commands
            wrap( syllabus.commands, send );

            boris.on( 'error', function ( err, data ) {
                log( 'BORIS ERROR - TODO' );
            } );

            boris.on( 'match', function ( err_reply, data, fn ) {
                var cmd = libra.pop();
                // log( 'boris on match data: %j', data + '' );
                cmd.zn( err_reply, data, cmd.fn );
            } );

            cocker.on( 'offline', function () {
                log( 'OFFLINE - TODO' );
                log( 'RESET LIBRA - TODO' );
                me.ready = false;
            } );

            cocker.on( 'online', function ( address ) {
                log( 'ONLINE - TODO' );
                me.ready = true;
                me.emit( 'ready', address );
            } );

            cocker.on( 'readable', function () {
                var data = cocker.read();
                if ( data ) {
                    // log( 'cocker on readable data: %j', data + '' )
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

    // TODO - multiple connection?
    sproto.connect = function ( opt ) {
        var me = this
            sopt = update( me.options.socket, opt );
        me.cocker.run( sopt );
        return me;
    };

    return Spade;
} )();