#!/usr/bin/env node

/* 
 * Spade, cache events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , inspect = util.inspect
    , Spade = require( '../' )
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    , custom_path = { filepath : __dirname + '/dummy-lua-scripts' }
    ;

log( '- created new Spade client with default options.' );

client.on( 'error', function ( err ) {
    eresult.push( 'error' );
    dbg( '  !error', arguments );
} );

client.on( 'cacheinit', function ( script_list ) {
    eresult.push( 'cacheinit' );
    dbg( '  !cacheinit', inspect( script_list.length, false, 3, true ) );
} );

client.on( 'scriptfailure', function ( sname, emsg ) {
    eresult.push( 'scriptfailure' );
    dbg( '  !scriptfailure', inspect( sname, false, 3, true ) );
} );

client.on( 'cacheload', function ( sname ) {
    eresult.push( 'cacheload' );
    dbg( '  !cacheload', inspect( sname, false, 3, true ) );
} );

client.on( 'cacheready', function ( lua_script_cache ) {
    eresult.push( 'cacheready' );
    dbg( '  !cacheready', inspect( Object.keys( lua_script_cache.cache ), false, 3, true ) );
} );

client.on( 'authorized', function ( db, reply, address ) {
    eresult.push( 'authorized' );
    dbg( '  !authorized', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'authfailed', function ( db, reply, address ) {
    eresult.push( 'authfailed' );
    dbg( '  !authfailed', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbselected', function ( db, reply, address ) {
    eresult.push( 'dbselected' );
    dbg( '  !dbselected', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbfailed', function ( db, reply, address ) {
    eresult.push( 'dbfailed' );
    dbg( '  !dbfailed', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'connect', function ( address ) {
    eresult.push( 'connect' );
    dbg( '  !connect', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'ready', function ( address ) {
    eresult.push( 'ready' );
    dbg( '  !ready', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'attempt', function ( attempt, address, interval ) {
    eresult.push( 'attempt' );
    dbg( ' !attempt', inspect( [ attempt, interval ], false, 1, true ) );
} );

client.on( 'offline', function ( address ) {
    eresult.push( 'offline' );
    dbg( '  !offline', inspect( [ address.host, address.port ], false, 1, true ) );
} );

client.on( 'lost', function ( address ) {
    eresult.push( 'lost' );
    dbg( '  !lost', inspect( [ address.host, address.port ], false, 1, true ) );
} );

log( '- added client listeners for script cache events.' );

log( '- call #initCache before #connect, with no options, to emit only "cacheinit" event.' );
client.initCache();

evts.push( 'cacheinit', 'connect', 'dbselected', 'ready', 'cacheload', 'cacheready' );

log( '- wait 2 seconds to load files and collect events..' );

setTimeout( function () {

    log( '- opening client connection.' );

    client.connect( null, function () {

        evts.push( 'offline', 'lost' );

        log( '- now close client connection.' );

        client.disconnect( function () {

            log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
            assert.deepEqual( eresult, evts, 'something goes wrong with script load! got: "' + eresult + '"' );

            log( '- re-opening client connection.' );

            evts.push( 'connect', 'dbselected', 'ready' );

            client.connect( null, function () {

                log( '- check collected events from client, should be: %s.', inspect( evts, false, 1, true ) );
                assert.deepEqual( eresult, evts, 'something goes wrong with script load! got: "' + eresult + '"' );

                log( '- reset results.' );
                eresult = [];
                evts = [];

                log( '- executing #initCache on "ready" event, with custom filepath for loading scripts.' );

                // 'scriptfailure', 'cacheload' events could be happen in any order
                evts.push( 'cacheinit', 'scriptfailure', 'cacheload', 'cacheready' );

                log( '- call #initCache after #connect, with custom filepath:', inspect( custom_path, false, 3, true ) );
                client.initCache( custom_path );

                log( '- wait 2 seconds to load files and collect events..' );

                setTimeout( function () {

                    log( '- check collected events from client' );

                    log( '- "cacheinit" should be the first event collected/emitted.' );
                    assert.ok( eresult[ 0 ] === 'cacheinit' );

                    log( '- there should be a "scriptfailure" event.' );
                    assert.ok( ~ eresult.indexOf( 'scriptfailure' ) );

                    log( '- there should be a "cacheload" event.' );
                    assert.ok( ~ eresult.indexOf( 'cacheload' ) );

                    log( '- "cacheready" should be the last event collected/emitted.' );
                    assert.ok( eresult[ eresult.length - 1 ] === 'cacheready' );

                    log( '- now close client connection.' );

                    client.disconnect();

                }, 2000 );

            } );
        } );
    } );

}, 2000 );