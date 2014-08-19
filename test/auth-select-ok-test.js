#!/usr/bin/env node

/* 
 * Spade, auth and select successful test, need Vapid devDependency and port 6380.
 */

exports.test = function ( done, assertions ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , Bolgia = require( 'bolgia' )
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
        }
        , client = Spade( opt )
        , Vapid = null
        , vapid_opt = {
            secret : 'secret'
            , maxdb : 16
        }
        , vport = 6380
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , exit = typeof done === 'function' ? done : function () {}
        ;

    try {
        Vapid = require( 'vapid' );
        vapid = Vapid( opt );
    } catch ( e ) {
        log( '- this test needs Vapid devDependency(see Readme): %s.', e.message );
        return;
    }

    log( '- a new Spade client was created with with custom options:', inspect( client.options ) );

    log( '- enable Vapid server, now it is listening on port: %s.', inspect( vport ) );

    // vapid.cli();
    vapid.listen( vport );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- opening client connection.' );

    // push expected events
    evts.push( 'connect' );
    evts.push( 'authorized', 'reply' );
    evts.push( 'dbselected', 'scanqueue', 'ready', 'reply' );

    client.connect( null, function () {

        // push expected events
        evts.push( 'reply', 'offline', 'lost' );

        log( '- now disconnecting client with QUIT.' );

        client.commands.quit( function () {
            log( '- OK, client was disconnected.' );
        } );

    } );

    log( '- wait 2 seconds to collect events..' );

    setTimeout( function () {

        log( '- check collected events from client, should be: %s.', inspect( evts ) );

        assertions.isDeepEqual( collected.events, evts, 'something goes wrong with client authorization! got: ' + inspect( collected.events ) );

        vapid.close()

        exit();

    }, 2000 );

};