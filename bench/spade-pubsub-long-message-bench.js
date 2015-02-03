#!/usr/bin/env node

/*
 * NOTE:
 * change default directive "client-output-buffer-limit pubsub" to "0 0 0" in redis.conf,
 * if you need more requests, otherwise clients will be disconnected by Redis for security.
 */

var log = console.log
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Spade = require( '../' )
    // number of clients
    , tclients = 20
    // number of requests to send
    , requests = 64 * 1024
    // client list
    , list = []
    , channels = [ 'd', 'e', 'u', 'c', 'e', 's' ]
    , rc = tclients * ( requests + channels.length )
    , cc = tclients
    , stime = 0
    , ttime = 0
    , long_string = 'spadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespadespade'
    , spade_opt = { hiredis : !! true }
    , publisher = null
    , reply_messages = 0
    ;

var count = function () {
   // log( - 1 + rc )
    if ( --rc === 0 ) {
        ttime = Date.now() - stime;
        log( '-> subscribers (clients):', tclients );
        log( '-> publishers:', 1 );
        log( '-> total reply messages for client subscriptions:', channels.length * tclients );
        assert.ok( reply_messages === channels.length * tclients, 'wrong number of messages replies form subscribe!' );
        log( '-> total messages published:', requests );
        log( '-> total messages received from publisher:', requests * tclients );
        log( '-> total msecs:', ttime );
        log( '-> rate:', Math.round( requests * tclients / ( ttime / 1000 ) ) + ' msgs/sec' );
        process.exit( 0 );
    }
};

var onError = function () {
    log( 'error', arguments );
    process.exit( 1 );
};

var sendCommands = function () {
    var i = 0
        , pcmd = publisher.commands.publish
        ;
    stime = Date.now();
    for ( ; i < requests; ++i ) pcmd( 'd', long_string );
};

var enqueue = function () {
    var me = this
        ;
    me.commands.subscribe( channels, function () {
        ++reply_messages;
    } );
    if ( --cc === 0 ) {
        sendCommands();
    }
};

var run = function () {
    var i = 0
        , n = tclients
        , s = null
        ;
    for ( ; i < n; ++i ) {
        s = Spade( spade_opt );
        list[ i ] = s;
        s.on( 'error', onError );
        s.on( 'message', count );
        // only once to prevent error on disconnection by Redis
        s.once( 'ready', enqueue.bind( s ) );
    }
    for ( ; --i >= 0; ) {
        list[ i ].connect();
    }
};

var add = function () {
    var s = Spade( spade_opt )
        ;
    publisher = s;
    s.once( 'ready', function () {
        run();
    } );
    s.connect();
};

log( '> Spade benchmark, %d subscribers / 1 publisher', tclients );

log( '\n-> using: "%s" parser.', Spade( spade_opt ).parser.hreader ? 'HIREDIS NATIVE' : 'BORIS JS' );
log( '-> message length: (%d bytes)\n', long_string.length );
// log( '"%s"\n', long_string );

add();