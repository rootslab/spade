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
    , inspect = util.inspect
    , Spade = require( '../' )
    , client = Spade()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Spade client with default options.' );

client.on( 'error', function ( oerr ) {
    eresult.push( 'error' );
    log( '  !error', inspect( [ oerr.cmd, oerr.err ], false, 3, true ) );
} );

client.on( 'cacheinit', function ( script_list ) {
    eresult.push( 'cacheinit' );
    log( '  !cacheinit', inspect( script_list.length, false, 3, true ) );
} );

client.on( 'scriptfailure', function ( sname, emsg ) {
    eresult.push( 'scriptfailure' );
    log( '  !scriptfailure', inspect( sname, false, 3, true ) );
} );

client.on( 'cacheload', function ( sname ) {
    eresult.push( 'cacheload' );
    log( '  !cacheload', inspect( sname, false, 3, true ) );
} );

client.on( 'cacheready', function ( lua_script_cache ) {
    eresult.push( 'cacheready' );
    log( '  !cacheready', inspect( Object.keys( lua_script_cache.cache ), false, 3, true ) );
} );

client.on( 'authorized', function ( db, reply, address ) {
    eresult.push( 'authorized' );
    log( '  !authorized', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'authfailed', function ( db, reply, address ) {
    eresult.push( 'authfailed' );
    log( '  !authfailed', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbselected', function ( db, reply, address ) {
    eresult.push( 'dbselected' );
    log( '  !dbselected', inspect( [ db, reply ], false, 3, true ) );
} );

client.on( 'dbfailed', function ( db, reply, address ) {
    eresult.push( 'dbfailed' );
    log( '  !dbfailed', inspect( [ db, reply ], false, 3, true ) );
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

client.on( 'monitor', function ( message ) {
    eresult.push( 'monitor' );
    dbg( '  !monitor', inspect( message, false, 1, true ) );
} );

log( '- added client listeners, also for "monitor" event.' );

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

    log( '- check default cache script, should be refused.' );
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