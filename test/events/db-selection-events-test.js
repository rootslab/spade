#!/usr/bin/env node

/* 
 * Spade, db selection events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Bolgia = require( 'bolgia' )
    , clone = Bolgia.clone
    , inspect = util.inspect
    , Spade = require( '../' )
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Spade client with default options.' );

client.on( 'dbfailed', function ( db, reply, address ) {
    eresult.push( 'dbfailed' );
    dbg( '  !dbfailed', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbselected', function ( db, reply, address ) {
    eresult.push( 'dbselected' );
    dbg( '  !dbselected', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'error', function () {
    eresult.push( 'error' );
    dbg( ' !error', inspect( arguments, false, 3, true ) );
} );

client.on( 'connect', function ( address ) {
    eresult.push( 'connect' );
    dbg( '  !connect', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'ready', function ( address ) {
    eresult.push( 'ready' );
    dbg( '  !ready', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'attempt', function ( attempt, address, interval ) {
    eresult.push( 'attempt' );
    dbg( ' !attempt', inspect( [ attempt, interval ], false, 1, true ) );
} );

client.on( 'offline', function ( address ) {
    eresult.push( 'offline' );
    dbg( '  !offline', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'lost', function ( address ) {
    eresult.push( 'lost' );
    dbg( '  !lost', inspect( [ address.host, address.port ], false, 1, true ) );
} );

log( '- added client listeners for db selection events.' );
log( '- opening client connection.' );

client.connect( null, function () {
    log( '- now client is connected and ready to send.' );
    // push expected events
    evts.push( 'connect', 'dbselected', 'ready' );
} );

log( '- wait 1 second to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
    assert.deepEqual( eresult, evts, 'something goes wrong with db selection! got: "' + eresult + '"' );

    log( '- now disconnecting client.' );
    client.disconnect( function () {
        log( '- client disconnected.' );
        // push expected events
        evts.push( 'offline', 'lost' );

        log( '- check collected events from client, should be: %s.', inspect( evts, false, 2, true ) );
        assert.deepEqual( eresult, evts, 'something goes wrong with client disconnection! got: "' + eresult + '"' );
    } );

}, 1000 );
