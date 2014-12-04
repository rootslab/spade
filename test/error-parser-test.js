#!/usr/bin/env node

/* 
 * Spade, mimic parser errors with Vapid devDependency ( needs port 6380 ).
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
                    requirepass : ''
                    , db : -1
                }
            }
            , hiredis : false
        }
        , client = Spade( opt )
        , Vapid = null
        , vp = null
        , vapid_opt = {
            secret : ''
            , maxdb : 16
        }
        , vport = 6380
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
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

    log( '- a new Spade client was created with with custom options:', inspect( client.options ) );

    log( '- enable Vapid server, now it is listening on port: %s.', inspect( vport ) );

    // vapid.cli();
    vp.listen( vport );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    // push expected events
    evts.push( 'connect' );

    client.connect( null, function () {

        log( '- now client is connected and ready to send/recieve.' );

        // push expected events
        evts.push( 'scanqueue', 'ready' );

        log( '- now sending a bad encoded message to client to force parser error and disconnection.' );

        // push expected error event, client reset connection then re-connects
        evts.push( 'error', 'offline', 'attempt' );

        // push expected events, client should be online
        evts.push( 'connect', 'scanqueue', 'ready' );

        vp.send( 'POISON' );

    } );

    log( '- wait 3 seconds to collect events..' );

    setTimeout( function () {

        log( '- now disconnecting client.' );

        client.disconnect( function () {

            log( '- client disconnected.' );

            // push expected events
            evts.push( 'offline', 'lost' );

        } );

        setTimeout( function () {

            log( '- check collected events from client, should be: %s.', inspect( evts ) );
            assert.deepEqual( collected.events, evts, 'something goes wrong with client disconnection! got: ' + inspect( collected.events ) );

            vp.close();
            exit();

        }, 1000 );

    }, 3000 );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();