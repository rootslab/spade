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
        , client = Spade()
        , another_client = Spade( {
            security : {
                '127.0.0.1:6379' : {
                    db : 1
                }
            }
        } )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        // channels
        , channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
        , sub_cback_OK = 0
        , unsub_cback_OK = 0
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;
    log( '- a new Spade client was created with default options.' );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

    log( '- now connecting client.' );

    // push expected events
    evts.push( 'connect', 'reply', 'dbselected', 'scanqueue', 'ready' );

    client.connect( null, function () {
        var i = 0
            ;

        client.commands.subscribe( channels, function () {
            log( '- I\'m SUBSCRIBE callback.' );
            sub_cback_OK = 1;
        } );

        log( '- try to execute a TIME command in pubsub mode.' );

        // push expected events
        evts.push( 'error' );
        evts.push( 'listen' );
        for ( ; i < channels.length; ++i ) evts.push( 'message' );

        client.commands.time( function ( is_err, reply, fn ) {
            log( '- TIME callback should get an error: %s.', fn( reply ) );
            assert.ok( is_err );
        } );

        client.on( 'shutup', function () {

            // push expected reply event from PING
            evts.push( 'reply' );

            client.commands.ping( function ( is_err, reply, fn ) {
                log( '- PING callback should get PONG reply, got:', fn( reply )[ 0 ] );
                assert.ok( fn( reply )[ 0 ] === 'PONG' );

                log( '- now disconnecting clients with QUIT.' );
                // push expected reply event from QUIT
                evts.push( 'reply' );
                // push expected reply events for disconnection
                evts.push( 'offline', 'lost' );

                client.commands.quit( function ( is_err, reply, fn ) {
                    log( '- client QUIT callback.', fn( reply ) );
                    assert.ok( fn( reply )[ 0 ] === 'OK' );
                } );

                // quit other client
                another_client.commands.quit( function ( is_err, reply, fn ) {
                    log( '- another client QUIT callback.', fn( reply ) );
                    assert.ok( fn( reply )[ 0 ] === 'OK' );
                } );

            } );

        } );



        log( '- now connecting another client.' );

        another_client.connect( null, function ( address ) {

            log( '- another client publish a message to channel.' );
            another_client.commands.publish( 'a', 'Houston we have a problem here!', function () {

                // push expected events, 3 unsubscribe messages + 1 published message
                for ( i = 0; i < 3 + 1; ++i ) evts.push( 'message' );
                evts.push( 'shutup' );
                log( '-  #unsubscribe client from all channels.' );
                client.commands.unsubscribe( null, function ( ) {
                    log( '- I\'m UNSUBSCRIBE callback.' );
                    unsub_cback_OK = 1;
                } );

            } );

        } );

    } );

    log( '- wait 2 seconds to collect events..' );

    setTimeout( function () {

        log( '- deep check collected events, should be:', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

        log( '- check execution of SUBSCRIBE and UNSUBSCRIBE callbacks:', inspect( [ sub_cback_OK, unsub_cback_OK ] ) );
        assert.deepEqual( [ sub_cback_OK, unsub_cback_OK ], [ 1, 1 ] );

        exit();

    }, 2000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();