#!/usr/bin/env node

/* 
 * Spade, db selection events test.
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
        , client = Spade()
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;
    log( '- a new Spade client was created with default options.' );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {

        log( '- now client is connected and ready to send.' );
        // push expected events
        evts.push( 'connect', 'reply', 'dbselected', 'scanqueue', 'ready' );

    } );

    log( '- wait 1 second to collect events..' );

    setTimeout( function () {

        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'something goes wrong with db selection! got: ' + inspect( collected.events ) );

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