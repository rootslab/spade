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
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        // channels
        , channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
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

    evts.push( 'queued', 'connect', 'reply', 'dbselected', 'scanqueue', 'ready' );

    client.commands.subscribe( channels );

    client.connect( null, function () {

        log( '- check collected events, should be:', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

          log( '- try to execute a TIME command in pubsub mode.' );

        // push expected error event
        evts.push( 'error' );

        client.commands.time( function ( is_err, reply, fn ) {
            log( '- TIME callback should get an error.' );
            assert.ok( is_err );
        } );


    } );

    log( '- now waiting 2 secs to collect events..' );

    setTimeout( function () {
        var i = 0
            ;
        // push expected message events
        evts.push( 'listen' );
        for ( ; i < channels.length; ++i ) evts.push( 'message' );

        // push expected connection event
        evts.push( 'reply' );
        log( '- now disconnecting client with QUIT.' );
        client.commands.quit( function ( is_err, reply, fn ) {
            log( '- QUIT callback.', fn( reply ) );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
            log( '- OK, client was disconnected.' );
        } );

        // push expected connection event
        evts.push( 'offline', 'lost' );

        setTimeout( function () {

            log( '- check collected events for client disconnection, should be:', inspect( evts ) );
            assert.deepEqual( collected.events.slice( 0, evts.length ), evts, 'got: ' + inspect( collected.events ) );

            exit();

        }, 1500 );

    }, 2000 );

    };

    // single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();