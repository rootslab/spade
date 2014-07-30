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
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    , channels = [ 'd', 'e', 'u', 'c', 'e', 's' ]
    , clen = channels.length
    , p = 0
    ;

log( '- created new Spade client with custom options:', inspect( client.options ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection.' );

client.connect( null, function () {
    var i = 0
        ;
    log( '- now client is connected and ready to send.' );

    // push expected events
    evts.push( 'connect', 'dbselected', 'scanqueue', 'ready', 'reply', 'listen' );

    // push expected events, 6 messages from SUBSCRIBE
    for ( ; i < channels.length; ++i ) evts.push( 'message' );

    // push expected reply events form PING, 6 messages
    for ( i = 0; i < channels.length; ++i ) evts.push( 'reply' );

    client.commands.subscribe( channels, function () {
        client.commands.ping( 'Eila', function ( is_err, reply, fn ) {
            if ( is_err ) {
                log( '- this Redis not support ping in PubSub mode, no matter..' )
                return process.exit( 0 );
            }
            ++p;
        } );
    } );
} );

log( '- now check if current Redis version supports PING in pubsub mode, wait 2 secs..' );
/*
 * if process doesn't exit, then PING is supported in PubSub mode,
 * reset and start test.
 */
setTimeout( function () {
    var i = 0
        ;
    log( 'ok, now test is running..' );

    log( '- now waiting 2 secs to collect events..' );
 
    setTimeout( function () {
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
            
            log( '- check PING calls, should be:', 6 );
            assert.ok( p, 6 );

        }, 1000 );

    }, 2000 );

}, 2000 );