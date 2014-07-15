#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test.
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
    , // channels
    channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
    ;

log( '- created new Spade client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- init client cache in offline mode.' );

client.initCache();

log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

log( '- now connecting client.' );

// push expected events
evts.push( 'connect', 'dbselected', 'scanqueue', 'ready' );

client.connect( null, function () {
    var i = 0
        ;

    client.commands.subscribe( channels );

    log( '- try to execute a ping command in pubsub mode.' );

    // push expected events
    evts.push( 'error', 'reply' );
    evts.push( 'listen' );
    for ( ; i < channels.length; ++i ) evts.push( 'message' );

    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

    client.on( 'shutup', function () {

        // push expected reply event from PING
        evts.push( 'reply' );

        client.commands.ping( function ( is_err, reply, fn ) {
            log( '- PING callback should get PONG reply, got:', fn( reply )[ 0 ] );
            assert.equal( fn( reply )[ 0 ], 'PONG' );

            log( '- now disconnecting clients with QUIT.' );
            // push expected reply event from QUIT
            evts.push( 'reply' );
            // push expected reply events for disconnection
            evts.push( 'offline', 'lost' );

            client.commands.quit( function ( is_err, reply, fn ) {
                log( '- client QUIT callback.', fn( reply ) );
                assert.ok( fn( reply )[ 0 ] === 'OK' );
            } );

            // quit other client
            another_client.commands.quit( function ( is_err, reply, fn ) {
                log( '- another client QUIT callback.', fn( reply ) );
                assert.ok( fn( reply )[ 0 ] === 'OK' );
            } );

        } );

    } );

    // push expected cache event
    evts.push( 'cacheinit', 'scriptfailure', 'cacheready', 'error' );

    log( '- now connecting another client.' );

    another_client.connect( null, function ( address ) {

        log( '- another client publish a message to channel.' );
        another_client.commands.publish( 'a', 'Houston we have a problem here!', function () {

            // push expected events, 3 unsubscribe messages + 1 published message
            for ( i = 0; i < 3 + 1; ++i ) evts.push( 'message' );
            evts.push( 'shutup' );

            log( '-  #unsubscribe client from all channels.' );
            client.commands.unsubscribe();

        } );

    } );

} );

log( '- wait 3 seconds to collect events..' );

setTimeout( function () {

    log( '- deep check collected events, should be:', inspect( evts ) );
    assert.deepEqual( eresult, evts, 'got: ' + inspect( eresult ) );

}, 3000 );