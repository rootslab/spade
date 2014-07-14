#!/usr/bin/env node

/* 
 * Spade, socket re-connection events test.
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

log( '- created new Spade client with custom options:', inspect( opt ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection to a not existemt host:port to force reconnection.' );

// push expected events
evts.push( 'offline', 'attempt', 'attempt', 'attempt', 'lost' );

client.connect();

log( '- wait 16 seconds to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts ) );
    assert.deepEqual( eresult, evts );

    log( '- opening connection to default Redis host:port.' );
    client.connect( { address : { port : 6379 } }, function () {

        log( '- now disconnecting client.' );
        client.disconnect( function () {
            log( '- client disconnected.' );

            // push expected events
            evts.push( 'connect', 'dbselected', 'scanqueue', 'ready', 'reply', 'offline', 'lost' );

            log( '- check collected events from client, should be: %s.', inspect( evts ) );
            assert.deepEqual( eresult, evts );
        } );

    } );

}, 16000 );
