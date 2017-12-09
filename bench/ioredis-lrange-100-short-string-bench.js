#!/usr/bin/env node

var log = console.log
    , ioredis = require( 'ioredis' )
    // number of clients
    , tclients = 20
    // number of requests to send
    , requests = 64 * 1024
    // client list
    , list = []
    , rc = requests
    , cc = tclients
    , stime = 0
    , ttime = 0
    , small_string = '1234'
    , hiredis = null
    ;

var sendCommands = function () {
    var i = 0
        , client = null
        ;

    stime = Date.now();

    for ( ; i < requests; ++i ) {
        client = list[ i % tclients ];
        client.lrange( 'mylist', 0, 99, function () {
            if ( --rc === 0 ) {
                ttime = Date.now() - stime;
                log( '-> command:', 'LRANGE mylist 0 99' );
                log( '-> clients:', tclients );
                log( '-> requests:', requests );
                log( '-> total msecs:', ttime );
                log( '-> rate:', Math.round( requests / ( ttime / 1000 ) ) + ' req/sec' );
                process.exit( 0 );
            }
        } );
    }
};

var enqueue = function () {
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
        s = ioredis( 6379, '127.0.0.1' );
        list[ i ] = s;
        s.on( 'ready', enqueue );
    }
};

var add = function () {
    var s = ioredis( 6379, '127.0.0.1' )
        ;
    s.once( 'ready', function () {
        var i = 0
            , r = 0
            , n = 100
            ;
        for ( ; i < n; ++i ) {
            s.lpush( 'mylist', small_string, function ( err, data, fn ) {
                if ( ++r === n ) {
                    s.quit( run );
                }
            } );
        }
    } );
};

log( '- node_redis benchmark, "LRANGE mylist 0 99" with a small string reply (%d bytes):\n  "%s"', small_string.length, small_string );

try {
    hiredis = require( 'hiredis' );
    log( '-> using: "HIREDIS NATIVE" parser.' );
} catch ( err ) {
    log( '-> using: "node_redis JS" parser.' );
} finally {
    add();
}