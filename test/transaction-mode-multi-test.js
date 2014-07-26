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
    , client = Spade( opt )
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

// push expected events
evts.push( 'queued', 'queued', 'error', 'queued', 'queued' );

log( '- #push MULTI, PING, TIME, SUBSCRIBE, MULTI in offline mode.' );

client.commands.multi();

client.commands.ping();

log( '- #pushing SUBSCRIBE in Transaction mode. should return immediately an error.' );

client.commands.subscribe( 'a', function ( is_err, reply, fn ) {
    log( '- check SUBSCRIBE callback error.' );
    assert.ok( is_err );
} );

client.commands.time();

client.commands.multi( function ( is_err, reply, fn ) {

    log( ' - 2nd MULTI should get an -ERR reply.' );
    assert.ok( is_err );

    client.commands.exec( function ( is_err, reply, fn ) {

        // push expected events
        evts.push( 'reply', 'reply', 'error-reply', 'reply', 'error-reply' );

        log( ' - check results for the EXEC reply.' );

        assert.ok( fn( reply )[ 0 ] === 'PONG' );
        assert.ok( fn( reply )[ 1 ].length === 2 );

        log( ' send EXEC without MULTI, should return an error reply.')

        client.commands.exec( function ( is_err, reply, fn ) {
             log( ' - 2nd EXEC should get an -ERR reply.' );
            assert.ok( is_err );
        } );

    } );
} );

log( '- opening client connection.' );

client.connect( null, function () {
    // push expected events
    evts.push( 'connect', 'scanqueue', 'ready', 'reply' );

    log( '- now client is connected and ready to send.' );

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
/**/