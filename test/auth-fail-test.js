#!/usr/bin/env node

/* 
 * Spade, auth failing test.
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
                requirepass : 'fake'
            }
        }
    }
    , client = Spade( opt )
    // expected events
    , evts = []
    // collected events
    , collected = client.logger.collected
    ;

log( '- created new Spade client with custom options:', inspect( opt ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
}, true );

log( '- opening client connection.' );

client.connect();

evts.push( 'connect', 'authfailed', 'error-reply', 'offline', 'lost' );

log( '- wait 1 second to collect events..' );

setTimeout( function () {

    log( '- check collected events from client, should be: %s.', inspect( evts ) );

    assert.deepEqual( collected.events, evts, 'something goes wrong with client authorization! got: ' + inspect( collected.events ) );

}, 1000 );
