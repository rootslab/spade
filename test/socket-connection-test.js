#!/usr/bin/env node

/* 
 * Spade, socket connection events test.
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
                    // disable db selection
                    db : -1
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
    log( '- a new Spade client was created with custom options:', inspect( opt ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {
        log( '- now client is connected and ready to send.' );
        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready' );
    } );

    log( '- wait 1 second to collect events..' );

    setTimeout( function () {

        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'something goes wrong with client connection! got: "' + collected.events + '"' );

        log( '- now disconnecting client.' );

        client.disconnect( function () {
            log( '- client disconnected.' );
     
            // push expected events
            evts.push( 'offline', 'lost' );

            log( '- check collected events from client, should be: %s.', inspect( evts ) );
            assert.deepEqual( collected.events, evts, 'something goes wrong with client disconnection! got: ' + inspect( collected.events ) );

            exit();
        } );

    }, 1000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();