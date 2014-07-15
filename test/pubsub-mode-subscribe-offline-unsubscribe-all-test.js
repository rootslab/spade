#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
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

evts.push( 'queued', 'connect', 'dbselected', 'scanqueue', 'ready' );

client.commands.subscribe( channels );

client.connect( null, function () {
    log( '- check collected events, should be:', inspect( evts ) );
     assert.deepEqual( eresult, evts );

    log( '- try to execute a ping command in pubsub mode.' );

    // push expected error event
    evts.push( 'error', 'reply' );

    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

    log( '- call #unsubscribe without arguments' );

    client.commands.unsubscribe();

} );

log( '- now waiting 1 secs to collect events..' );

setTimeout( function () {
    var i = 0
        ;
    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get PONG reply, got:', fn( reply )[ 0 ] );
        assert.equal( fn( reply )[ 0 ], 'PONG' );
    } );
    // push expected message events ( + 3 unsubscribe replies )
    evts.push( 'listen' );
    for ( ; i < channels.length + 3; ++i ) evts.push( 'message' );
    evts.push( 'shutup' );
    // push expected cache event
    evts.push( 'cacheinit', 'cacheload', 'cacheready' );
    log( '- check collected cache events, should be:', inspect( evts ) );
    assert.deepEqual( eresult.slice( 0, evts.length ), evts, 'got: ' + inspect( eresult ) );

    log( '- now disconnecting client with QUIT.' );

    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
    } );

}, 1000 );