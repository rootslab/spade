#!/usr/bin/env node

/* 
 * Spade, cache events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Spade = require( '../' )
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    , custom_path = { filepath : __dirname + '/deps/dummy-lua-scripts' }
    ;

log( '- created new Spade client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- call #initCache before #connect, with no options, to emit only "cacheinit" event.' );

client.initCache();

evts.push( 'cacheinit', 'connect', 'dbselected', 'scanqueue', 'ready', 'reply', 'cacheload', 'cacheready', 'reply' );

log( '- wait 2 seconds to load files and collect events..' );

setTimeout( function () {

    log( '- opening client connection.' );

    client.connect( null, function () {

        evts.push( 'offline', 'lost' );

        log( '- now close client connection.' );

        client.disconnect( function () {

            log( '- check collected events from client, should be: %s.', inspect( evts ) );
            assert.deepEqual( eresult, evts, 'something goes wrong with script load! got: "' + eresult + '"' );

            log( '- re-opening client connection.' );

            evts.push( 'connect', 'dbselected', 'scanqueue', 'ready' );

            client.connect( null, function () {

                log( '- check collected events from client, should be: %s.', inspect( evts ) );
                assert.deepEqual( eresult, evts, 'something goes wrong with script load! got: "' + eresult + '"' );

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
                    assert.ok( eresult[ 0 ] === 'cacheinit', 'got: ' + eresult[ 0 ] );

                    log( '- there should be a "scriptfailure" event.' );
                    assert.ok( ~ eresult.indexOf( 'scriptfailure' ) );

                    log( '- there should be a "cacheload" event.' );
                    assert.ok( ~ eresult.indexOf( 'cacheload' ) );

                    log( '- "there should be a "cacheready" event..' );
                    assert.ok( eresult.indexOf( 'cacheready' ) );

                    log( '- now close client connection.' );

                    client.disconnect();

                }, 2000 );

            } );
        } );
    } );

}, 2000 );