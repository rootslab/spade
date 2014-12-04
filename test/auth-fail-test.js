#!/usr/bin/env node

/* 
 * Spade, auth failing test.
 */

exports.test = function ( done, assertions ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
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
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;

    log( '- a new Spade client was created with custom options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( null, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect();

    evts.push( 'connect', 'error-reply', 'authfailed', 'offline', 'lost' );

    log( '- wait 1 second to collect events..' );

    setTimeout( function () {

        log( '- check collected events from client, should be: %s.', inspect( evts ) );

        assert.deepEqual( collected.events, evts, 'something goes wrong with client authorization! got: ' + inspect( collected.events ) );

        exit();

    }, 1000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();