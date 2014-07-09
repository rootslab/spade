#!/usr/bin/env node

/* 
 * Spade, socket re-connection events test.
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
        socket : {
            address : {
                port : 9999
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
    dbg( '  !attempt', inspect( [ attempt, interval ], false, 1, true ) );
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

log( '- opening client connection to a not existemt host:port to force reconnection.' );

// push expected events
evts.push( 'offline', 'attempt', 'attempt', 'attempt', 'lost' );

client.connect();

log( '- wait 16 seconds to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
    assert.deepEqual( eresult, evts );

    log( '- opening connection to default Redis host:port.' );
    client.connect( { address : { port : 6379 } }, function () {

        log( '- now disconnecting client.' );
        client.disconnect( function () {
            log( '- client disconnected.' );

            // push expected events
            evts.push( 'connect', 'ready', 'offline', 'lost' );

            log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
            assert.deepEqual( eresult, evts );
        } );

    } );

}, 16000 );
