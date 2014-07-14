#!/usr/bin/env node

/* 
 * Spade, monitor mode events test.
 * Send monitor commands on 'cacheready', specifying the callback.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
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
    , eresult = []
    ;

log( '- created new Spade client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- now connecting client.' );

client.connect( null, function () {

    log( '- init client cache with a "cacheready" callback.' );

    client.initCache( null, null, function ( cache ) {

        log( '- execute MONITOR command when cache is ready.' );

        client.commands.monitor( function ( is_err, reply, fn ) {
            log( '- MONITOR callback should execute and get OK.' );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
        } );

        log( '- try to execute a ping command in monitor mode.' );

        client.commands.ping( function ( is_err, reply, fn ) {
            log( '- PING callback should get an error.' );
            assert.ok( is_err );
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

            log( '- wait 2 seconds to collect monitor events' );

            setTimeout( function () {
                var i = 0
                    , r = null
                    , el = null
                    , isArray = Array.isArray
                    ;
                // check received monitor messages
                for ( r in eresult ) {
                    el = eresult[ r ];
                    if ( isArray( el ) ) {
                        log( '- check if %s exists in monitor messages.', evts[ i ] );
                        log( el [ 0 ])
                        assert.ok( ~ el[ 0 ].indexOf( evts[ i++ ] ), 'monitor messages should contain these commands: ' + evts );
                    }
                };

                log( '- disconnect other client.' );
                another_client.disconnect();

            }, 2000 );

        } );

    } );

} );

log( '- wait 6 seconds to collect events' );

setTimeout( function () {

    log( '- check default script, should be accepted before monitor.' );
    assert.ok( ~eresult.indexOf( 'cacheload' ) );
    assert.ok( ! ~eresult.indexOf( 'scriptfailure' ) );

    log( '- cache should not be empty.', client.lua.cache.size() );
    assert.ok( client.lua.cache.size()[ 0 ] > 0 );

    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function () {
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        // end test
        log( '- check collected events for client disconnection.' );
        assert.ok( ~eresult.indexOf( 'offline' ) );
        assert.ok( ~eresult.indexOf( 'lost' ) );
    }, 1000 );

}, 6000 );