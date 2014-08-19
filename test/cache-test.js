#!/usr/bin/env node

/* 
 * Spade, cache events test.
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
        , custom_path = { filepath : __dirname + '/deps/dummy-lua-scripts' }
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- a new Spade client was created with default options.' );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- call #initCache before #connect, with no options, to emit only "cacheinit" event.' );

    client.initCache();

    evts.push( 'cacheinit', 'connect', 'dbselected', 'scanqueue', 'ready', 'reply', 'cacheload', 'cacheready', 'reply' );

    log( '- wait 2 seconds to load files and collect events..' );

    setTimeout( function () {

        log( '- opening client connection.' );

        client.connect( null, function () {

            log( '- now client is connect, wait 2 seconds before disconnecting..' );

            setTimeout( function () {

                evts.push( 'offline', 'lost' );

                log( '- now close client connection.' );

                client.disconnect( function () {

                    log( '- check collected events from client, should be: %s.', inspect( evts ) );
                    assertions.isDeepEqual( collected.events, evts, 'something goes wrong with script load! got: ' + inspect( collected.events ) );

                    log( '- re-opening client connection.' );

                    evts.push( 'connect', 'dbselected', 'scanqueue', 'ready' );

                    client.connect( null, function () {

                        log( '- check collected events from client, should be: %s.', inspect( evts ) );
                        assertions.isDeepEqual( collected.events, evts, 'something goes wrong with script load! got: ' + inspect( collected.events ) );

                        log( '- reset results.' );

                        log( '- executing #initCache on "ready" event, with custom filepath for loading scripts.' );

                        // 'scriptfailure', 'cacheload' events could be happen in any order
                        evts.push( 'reply', 'cacheinit', 'scriptfailure', 'cacheload', 'cacheready', 'reply' );

                        log( '- call #initCache after #connect, with custom filepath:', inspect( custom_path ) );
                        client.initCache( custom_path );

                        log( '- wait 2 seconds to load files and collect events..' );

                        setTimeout( function () {

                            log( '- check collected events from client' );

                            log( '- "cacheinit" should be the first event collected/emitted.' );
                            assertions.isOK( collected.events[ 0 ] === 'cacheinit', 'got: ' + collected.events[ 0 ] );

                            log( '- there should be a "scriptfailure" event.' );
                            assertions.isOK( ~ collected.events.indexOf( 'scriptfailure' ) );

                            log( '- there should be a "cacheload" event.' );
                            assertions.isOK( ~ collected.events.indexOf( 'cacheload' ) );

                            log( '- "there should be a "cacheready" event..' );
                            assertions.isOK( collected.events.indexOf( 'cacheready' ) );

                            log( '- now close client connection.' );

                            client.disconnect( exit );

                        }, 2000 );

                    } );

                }, 3000 );

            } );

        } );

    }, 2000 );

};