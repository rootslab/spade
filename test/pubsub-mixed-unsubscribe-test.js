#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test.
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
        , channels = [ 'd', 'e', 'u', 'c', 'e', 's' ]
        , p = 0
        , u = 0
        , legacy = 0
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;
    log( '- a new Spade client was created with custom options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    client.connect( null, function () {
        var i = 0
            ;
        log( '- now client is connected and ready to send.' );

        // push expected events
        evts.push( 'connect', 'scanqueue', 'ready', 'listen' );

        // push expected events, 6 messages from subscribe
        for ( ; i < channels.length; ++i ) evts.push( 'message' );

        // push expected events, 5 messages from the first unsubscribe without arguments
        for ( i = 0; i < channels.length - 1; ++i ) evts.push( 'message' );

        // now pubsub mode should be off, push expected shutup event
        evts.push( 'shutup' );

        /*
         * NOTE: subscribe callback will be executes channels.length times,
         * then unsubscrbe will be called multiple times (6)
         */

        // push expected message events, 5 empty unsubscriptions from unsubscribe, [ 'unsubscribe', 0, 0 ]
        for ( i = 0; i < channels.length - 1; ++i ) evts.push( 'message' );

        client.commands.subscribe( channels, function () {
            // coutn unsubscribe calls
            ++u;
            client.commands.unsubscribe( null, function () {
                // count pings calls
                ++p;
                client.commands.ping( 'Eilà!', function ( is_err, reply, fn ) {
                    if ( is_err ) legacy = 1;
                } );

            } );

        } );

    } );

    log( '- now waiting 2 secs to collect events..' );

    setTimeout( function () {

        var i = 0
            ;
        /*
         * push expected reply events form PING, unsubscribe callback will be executed
         * 5 times for the first unsubscriptions + 5 times for all empty unsubscriptions,
         then 10.
         */
        for ( i = 0; i < 10; ++i ) evts.push( legacy ? 'error-reply' : 'reply' );

        log( '- now disconnecting client with QUIT.' );

        // push expected connection event
        evts.push( 'reply', 'offline', 'lost' );

        client.commands.quit( function ( is_err, reply, fn ) {
            log( '- QUIT callback.', fn( reply ) );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
            log( '- OK, client was disconnected.' );
        } );

        setTimeout( function () {

            log( '- check collected events for client, should be:', inspect( evts ) );
            assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );
            
            log( '- check UNSUBSCRIBE calls, should be:', 6 );
            assert.ok( u === 6 );

            log( '- check PING calls, should be:', 10 );
            assert.ok( p === 10 );

            exit();

        }, 1000 );

    }, 2000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();