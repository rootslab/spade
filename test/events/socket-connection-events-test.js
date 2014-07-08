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
    , inspect = util.inspect
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

client.on( 'error', function () {
    eresult.push( 'error' );
    log( ' !error', inspect( arguments, false, 3, true ) );
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

log( '- added client listeners for socket connection events.' );
log( '- opening client connection.' );

client.connect( null, function () {
    log( '- now client is connected and ready to send.' );
    // push expected events
    evts.push( 'connect', 'ready' );
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
