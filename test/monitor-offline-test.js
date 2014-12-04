#!/usr/bin/env node

/* 
 * Spade, monitor mode events test.
 */
exports.test = function ( done, assertions ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , test_utils = require( './deps/test-utils' )
        , format = test_utils.format
        , Spade = require( '../' )
        , client = Spade()
        // expected events
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

    log( '- init client cache in offline mode.' );

    client.initCache();

    log( '- execute/enqueue MONITOR command in offline mode.' );

    client.commands.monitor( function ( is_err, reply, fn ) {
        log( '- MONITOR callback should execute and get OK.' );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
    } );

    log( '- now connecting client.' );

    client.connect( null, function () {

        log( '- try to execute a ping command in monitor mode.' );

        client.commands.ping( function ( is_err, reply, fn ) {
            log( '- PING callback should get an error: %s.', fn( reply ) );
            assert.ok( is_err );
        } );

    } );

    log( '- now waiting 1 sec to collect events..' );

    setTimeout( function () {

        log( '- check default script, should be refused.' );
        assert.ok( ~ collected.events.indexOf( 'scriptfailure' ) );

        log( '- cache should be empty:', [ 0, 0 ] );
        assert.deepEqual( client.lua.cache.size(), [ 0, 0 ] );

        log( '- now disconnecting client with QUIT.' );
        client.commands.quit( function () {
            log( '- OK, client was disconnected.' );
        } );

        setTimeout( function () {

            log( '- check collected events for client disconnection.' );
            assert.ok( ~ collected.events.indexOf( 'offline' ) );
            assert.ok( ~ collected.events.indexOf( 'lost' ) );
            exit();
        }, 1000 );

    }, 1000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();