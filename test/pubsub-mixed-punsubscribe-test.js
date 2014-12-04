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
        evts.push( 'connect', 'scanqueue', 'ready', 'listen' );

        client.commands.subscribe( 'channel', function () {
            // push expected event
            evts.push( 'message' );
            client.commands.psubscribe( 'chan*', function () {
                // push expected event
                evts.push( 'message' );
                client.commands.unsubscribe( null, function () {
                    // push expected event
                    evts.push( 'message' );
                    client.commands.punsubscribe( null, function () {
                        // push expected event
                        evts.push( 'message', 'shutup' );
                    } );
                } );
            } );
        } );

    } );

    log( '- now waiting 2 secs to collect events..' );

    setTimeout( function () {

        var i = 0
            ;

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

            exit();

        }, 1000 );

    }, 2000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();