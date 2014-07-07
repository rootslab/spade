#!/usr/bin/env node

/* 
 * Spade. db selection events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , inspect = util.inspect
    , Spade = require( '../' )
    , client = Spade( {
        security : {
            '127.0.0.1:6379' : {
                db : 1024
            }
        }
    } )
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Spade client with default options.' );

client.on( 'dbselected', function ( db, reply, address ) {
    eresult.push( 'dbselected' );
    log( '  !dbselected', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbfailed', function ( db, reply, address ) {
    eresult.push( 'dbfailed' );
    log( '  !dbfailed', inspect( [ db, reply ], false, 3, true ) );
} );

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

client.connect();

evts.push( 'connect', 'dbfailed', 'offline', 'lost' );

log( '- wait 2 secs to collect events..' );

setTimeout( function () {
    log( '- check emitted events from client, should be: %s.', inspect( evts, false, 1, true ) );
    assert.deepEqual( eresult, evts, 'something goes wrong with client db selection!' );
}, 2000 );
