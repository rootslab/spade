#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? log : emptyFn
    , assert = require( 'assert' )
    , util = require( 'util' )
    , test_utils = require( './deps/test-utils' )
    , inspect = util.inspect
    , format = test_utils.format
    , iopt = {
        showHidden : false
        , depth : 3
        , colors : true
        , customInspect : true 
    }
    , Spade = require( '../' )
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    , // channels
    channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
    ;

log( '- created new Spade client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- init client cache in offline mode.' );

client.initCache();

log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

log( '- now connecting client.' );

evts.push( 'connect', 'dbselected', 'scanqueue', 'ready' );

client.connect( null, function () {

    log( '- check collected events, should be:', inspect( evts, iopt ) );
    assert.deepEqual( eresult, evts );

    client.commands.subscribe( channels, function ( is_err, data, fn ) {
        // push expected reply event
        evts.push( 'reply' );
        log( '- check collected events, should be:', inspect( evts, iopt ) );
        assert.deepEqual( eresult, evts );
        log( '- SUBSCRIBE callback should execute only for 1st message reply, and should be', inspect( [ 'subscribe', 'a', 1 ], iopt ) );
        assert.deepEqual( fn( data ), [ 'subscribe', 'a', 1 ]  );
    } );

    log( '- try to execute a ping command in pubsub mode.' );
    // push expected error event
    evts.push( 'error' );
    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

} );

log( '- now waiting 1 secs to collect events..' );

setTimeout( function () {
    var i = 0
        ;
    // push expected message event
    for ( ; i < channels.length; ++i ) evts.push( 'message' );
    log( '- check collected message events, should be:', inspect( evts, iopt ) );
    assert.deepEqual( eresult.slice( 0, evts.length ), evts );

    // push expected cache event
    evts.push( 'cacheinit', 'scriptfailure', 'cacheready', 'error' );
    log( '- check collected cache events, should be:', inspect( evts, iopt ) );
    assert.deepEqual( eresult.slice( 0, evts.length ), evts );

    log( '- cache should be empty:', [ 0, 0 ] );
    assert.deepEqual( client.lua.cache.size(), [ 0, 0 ] );

    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
        log( '- OK, client was disconnected.' );
    } );

    // push expected connection event
    evts.push( 'offline', 'lost' );

    setTimeout( function () {
        log( '- check collected events for client disconnection, should be:', inspect( evts, iopt ) );
        assert.deepEqual( eresult.slice( 0, evts.length ), evts );
    }, 1000 );

}, 1000 );