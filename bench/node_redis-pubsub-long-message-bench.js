#!/usr/bin/env node

/*
 * NOTE:
 * change default directive "client-output-buffer-limit pubsub" to "0 0 0" in redis.conf,
 * if you need more requests, otherwise clients will be disconnected by Redis for security.
 */

var log = console.log
    , nRedis = require( 'redis' )
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
    , long_string = 'node_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redisnode_redis'
    , publisher = null
    , hiredis = null
    ;

var count = function () {
    if ( --rc === 0 ) {
        ttime = Date.now() - stime;
        log( '-> subscribers (clients):', tclients );
        log( '-> publishers:', 1 );
        log( '-> total reply messages for client subscriptions:', channels.length * tclients );
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
        ;
    stime = Date.now();
    for ( ; i < requests; ++i ) publisher.publish( 'd', long_string );
};

var enqueue = function () {
    var me = this
        ;
    me.subscribe( channels, function () {
        // node_redis doesn't properly handle multiple subscription callbacks
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
        s = nRedis.createClient( 6379, '127.0.0.1' );
        list[ i ] = s;
        s.on( 'error', onError );
        s.on( 'ready', enqueue );
        s.on( 'message', count );
        // count also subscribe messages
        s.on( 'subscribe', count );
    }
};

var add = function () {
    var s = nRedis.createClient( 6379, '127.0.0.1' )
        ;
    publisher = s;
    s.once( 'ready', function () {
        run();
    } );
};

log( '> node_redis benchmark, %d subscribers / 1 publisher', tclients );

try {
    hiredis = require( 'hiredis' );
    log( '-> using: "HIREDIS NATIVE" parser.' );
} catch ( err ) {
    log( '-> using: "node_redis JS" parser.' );
} finally {
    log( '-> message length: (%d bytes)\n', long_string.length );
    add();
}

add();