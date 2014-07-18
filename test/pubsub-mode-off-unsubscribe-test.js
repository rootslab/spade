#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , Bolgia = require( 'bolgia' )
    , clone = Bolgia.clone
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Spade = require( '../' )
    , opt = {
        security : {
            '127.0.0.1:6379' : {
                // disable db selection
                db : -1
            }
        }
    }
    , client = Spade( clone( opt ) )
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Spade client with custom options:', inspect( opt ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection.' );

client.connect( null, function () {

    log( '- now client is connected and ready to send.' );

    // push expected events
    evts.push( 'connect', 'scanqueue', 'ready' );

    // push expected event
    evts.push( 'error' );

    log( '- send unsubscribe without arguments when the client is not in PubSub mode.' );

    client.commands.unsubscribe( [], function ( is_err_reply, reply, fn ) {

        log( '-  unsubscribe should receive an error reply.' );
        assert.ok( is_err_reply );
        assert.ok( eresult.indexOf( 'listen' ) < 0 );
        assert.ok( eresult.indexOf( 'shutup' ) < 0 );

        // push expected event
        evts.push( 'error' );

        client.commands.unsubscribe( [ 1, 2, 3 ], function ( is_err_reply, reply, fn ) {

            log( '-  unsubscribe should receive an error reply.' );
            assert.ok( is_err_reply );
            log( '- check, no "listen" or "shutup" events should be present.' );
            assert.ok( eresult.indexOf( 'listen' ) < 0 );
            assert.ok( eresult.indexOf( 'shutup' ) < 0 );

            // push expected event
            evts.push( 'reply' );

            log( '- client should not be in PubSub mode, now send PING and check reply, should be "OK".' );

            client.commands.ping( function ( is_err_reply, reply, fn ) {
                log( '- check PING reply, it should not be an error.' );
                assert.ok( ! is_err_reply );
                log( '- PING reply is:', inspect( fn( reply ) ) );
                assert.deepEqual( fn( reply ), [ 'PONG' ] );
            } );

        } );

    } );

} );

log( '- now waiting 2 secs to collect events..' );

setTimeout( function () {

    var i = 0
        ;

    log( '- now disconnecting client with QUIT.' );
    // push expected connection event
    evts.push( 'reply', 'offline', 'lost' );

    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        log( '- check collected events for client, should be:', inspect( evts ) );
         assert.deepEqual( eresult, evts, 'got: ' + inspect( eresult ) );
    }, 1000 );

}, 2000 );