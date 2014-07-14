#!/usr/bin/env node

/* 
 * Spade, db selection events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Bolgia = require( 'bolgia' )
    , clone = Bolgia.clone
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Spade = require( '../' )
    , client = Spade()
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

log( '- opening client connection.' );

client.connect( null, function () {
    log( '- now client is connected and ready to send.' );
    // push expected events
    evts.push( 'connect', 'dbselected', 'scanqueue', 'ready', 'reply' );
} );

log( '- wait 1 second to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts ) );
    assert.deepEqual( eresult, evts, 'something goes wrong with db selection! got: "' + eresult + '"' );

    log( '- now disconnecting client.' );
    client.disconnect( function () {
        log( '- client disconnected.' );
        // push expected events
        evts.push( 'offline', 'lost' );

        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( eresult, evts, 'something goes wrong with client disconnection! got: "' + eresult + '"' );
    } );

}, 1000 );
