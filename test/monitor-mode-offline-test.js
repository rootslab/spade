#!/usr/bin/env node

/* 
 * Spade, monitor mode events test.
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
    ;

log( '- created new Spade client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- init client cache in offline mode.' );

client.initCache();

log( '- execute/enqueue monitor command in offline mode.' );

client.commands.monitor( function ( is_err, reply, fn ) {
    log( '- MONITOR callback should execute and get OK.' );
    assert.ok( fn( reply )[ 0 ] === 'OK' );
} );

log( '- now connecting client.' );

client.connect( null, function () {

    log( '- try to execute a ping command in monitor mode.' );

    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

} );

// 'connect', 'dbselected', 'ready', 'error', 'cacheinit', 'scriptfailure', 'cacheready', 'error'

log( '- now waiting 1 secs to collect events..' );

setTimeout( function () {

    log( '- check default script, should be refused.' );
    assert.ok( ~eresult.indexOf( 'scriptfailure' ) );

    log( '- cache should be empty:', [ 0, 0 ] );
    assert.deepEqual( client.lua.cache.size(), [ 0, 0 ] );

    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function () {
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        log( '- check collected events for client disconnection.' );
        assert.ok( ~eresult.indexOf( 'offline' ) );
        assert.ok( ~eresult.indexOf( 'lost' ) );
    }, 1000 );

}, 1000 );
/**/