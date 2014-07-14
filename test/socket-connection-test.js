#!/usr/bin/env node

/* 
 * Spade, socket connection events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Bolgia = require( 'bolgia' )
    , clone = Bolgia.clone
    , test_utils = require( './deps/test-utils' )
    , inspect = util.inspect
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

log( '- created new Spade client with custom options:', inspect( opt, false, 3, true ) );

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
} );

log( '- wait 1 second to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
    assert.deepEqual( eresult, evts, 'something goes wrong with client connection! got: "' + eresult + '"' );

    log( '- now disconnecting client.' );
    client.disconnect( function () {
        log( '- client disconnected.' );
 
        // push expected events
        evts.push( 'offline', 'lost' );

        log( '- check collected events from client, should be: %s.', inspect( evts, false, 2, true ) );
        assert.deepEqual( eresult, evts, 'something goes wrong with client disconnection! got: "' + eresult + '"' );
    } );

}, 1000 );