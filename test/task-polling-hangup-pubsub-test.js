#!/usr/bin/env node

/* 
 * Spade, test for polling task in pubsub mode.
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
            socket : {
                address : {
                    port : 6380
                }
            }
            , security : {
                '127.0.0.1:6380' : {
                    requirepass : 'secret'
                }
            }
            , queue : {
                timestamps : true
            }
        }
        , client = Spade( opt )
        , Vapid = null
        , vp = null
        , vapid_opt = {
            secret : 'secret'
            , maxdb : 16
        }
        , vport = 6380
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , intval = 2000
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;


    try {
        Vapid = require( 'vapid' );
        vp = Vapid( vapid_opt );
    } catch ( e ) {
        log( '- this test needs Vapid devDependency(see Readme): %s.', e.message );
        return;
    }

    log( '- a new Spade client was created with default options:', inspect( client.options ) );

    log( '- enable Vapid server, now it is listening on port: %s.', inspect( vport ) );

    // vapid.cli();
    vp.listen( vport );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- now #initTasks.' );
    client.initTasks();

    log( '- opening client connection.' );

    client.connect( null, function () {

        log( '- now client is connected and ready to send.' );

        // push expected events
        evts.push( 'connect', 'reply', 'authorized', 'reply', 'dbselected', 'scanqueue', 'ready' );

        evts.push( 'listen', 'message' );

        log( '- client enters in pubsub mode.' );
        client.commands.subscribe( 'a', function () {

            client.on( 'polling', function () {
                if ( vp.silent ) return;
                log( '- now #mute Vapid Server.. ');
                vp.mute();
            } );

            // push expected events
            evts.push( 'polling', 'hangup', 'offline', 'lost' );

            log( '- run polling task, with reconnect option set to %s, hanghup timeout is set to %s secs.', inspect( false ), inspect( 2 ) );
            client.tasks.polling.run( intval, [ null, 'BANG!', 1000, false ] );

            log( '- now waiting %s secs to collect events..', inspect( 5 ) );
            setTimeout( function () {

                log( '- check collected events for client, should be:', inspect( evts ) );
                assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

                vp.close();

                exit();

            }, 5000 );

        } );

    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();