#!/usr/bin/env node

/* 
 * Spade, monitor mode events test.
 * Send monitor commands on 'cacheready', specifying the callback.
 */
exports.test = function ( done, assertions ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , test_utils = require( './deps/test-utils' )
        , format = test_utils.format
        , Spade = require( '../' )
        , client = Spade()
        , another_client = Spade( {
            security : {
                '127.0.0.1:6379' : {
                    db : 1
                }
            }
        } )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;
    log( '- a new Spade client was created with default options.' );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- now connecting client.' );

    client.connect( null, function () {

        log( '- init client cache with a "cacheready" callback.' );

        client.initCache( null, null, function ( cache ) {

            log( '- execute MONITOR command when cache is ready.' );

            client.commands.monitor( function ( is_err, reply, fn ) {
                log( '- MONITOR callback should execute and get OK.' );
                assert.ok( fn( reply )[ 0 ] === 'OK' );
            } );

            log( '- try to execute a PING command in monitor mode.' );

            client.commands.ping( function ( is_err, reply, fn ) {
                log( '- PING callback should get an error: %s.', fn( reply ) );
                assert.ok( is_err );
            } );

            log( '- try to execute a MONITOR command in monitor mode.' );

            client.commands.monitor( function ( is_err, reply, fn ) {
                log( '- MONITOR callback should get an error: %s.', fn( reply ) );
                // assert.ok( is_err );
            } );
            log( '- connecting another client to Redis for sending commands.' );

            log( '- the other client will automatically send "SELECT db" command.' );

            another_client.connect( null, function ( address ) {

                log( '- the other client is sending PING.' );
                another_client.commands.ping();

                log( '- the other client is sending KEYS.' );
                another_client.commands.keys( '*' );

                // push expected monitor message
                evts = [ 'SELECT', 'PING', 'KEYS' ];

                log( '- wait 1 second to collect monitor events' );

                setTimeout( function () {
                    var i = 0
                        , r = null
                        , el = null
                        , isArray = Array.isArray
                        ;
                    // check received monitor messages
                    for ( r in collected.events ) {
                        el = collected.events[ r ];
                        if ( isArray( el ) ) {
                            log( '- check if %s exists in monitor messages.', evts[ i ] );
                            log( el [ 0 ] );
                            assert.ok( ~ el[ 0 ].indexOf( evts[ i++ ] ), 'monitor messages should contain these commands: ' + evts );
                        }
                    }

                    log( '- disconnect other client.' );
                    another_client.disconnect();

                }, 1000 );

            } );

        } );

    } );

    log( '- wait 6 seconds to collect events' );

    setTimeout( function () {

        log( '- check default script, should be accepted before monitor.' );
        assert.ok( ~ collected.events.indexOf( 'cacheload' ) );
        assert.ok( ! ~ collected.events.indexOf( 'scriptfailure' ) );

        log( '- cache should not be empty.', client.lua.cache.size() );
        assert.ok( client.lua.cache.size()[ 0 ] > 0 );

        log( '- now disconnecting client with QUIT.' );
        client.commands.quit( function () {
            log( '- OK, client was disconnected.' );
        } );

        setTimeout( function () {

            // end test
            log( '- check collected events for client disconnection.' );
            assert.ok( ~collected.events.indexOf( 'offline' ) );
            assert.ok( ~collected.events.indexOf( 'lost' ) );

            exit();

        }, 1000 );

    }, 6000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();