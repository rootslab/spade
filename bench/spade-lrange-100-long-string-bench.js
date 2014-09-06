#!/usr/bin/env node

var log = console.log
    , Spade = require( '../' )
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
    , long_string = "ABCDEFGHILMNOPQRSTUVZJKXYW0123456789abcdefghilmnopqrstuvzjkxyw0123456789"
    , spade_opt = {
        hiredis : !!true
        , security : {
            '127.0.0.1:6379' : {
                // -1 disables SELECT db on connection
                db : -1
            }
        }
    }
    ;

var sendCommands = function () {
    var i = 0
        , ccmd = null
        ;

    stime = Date.now();

    for ( ; i < requests; ++i ) {
        ccmd = list[ i % tclients ].commands;
        ccmd.lrange( 'mylist', 0, 99, function () {
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
        s = Spade( spade_opt );
        list[ i ] = s;
        s.on( 'ready', enqueue );
    }
    for ( ; --i >= 0; ) {
        list[ i ].connect();
    }
};

var add = function () {
    var s = Spade( spade_opt )
        , commands = s.commands
        ;
    s.once( 'ready', function () {
        var i = 0
            , r = 0
            , n = 100
            ;
        for ( ; i < n; ++i ) {
            commands.lpush( 'mylist', long_string, function ( err, data, fn ) {
                if ( ++r === n ) {
                    commands.quit( run );
                }
            } );
        }
    } );
    s.connect();
};

log( '- benchmark "LRANGE mylist 0 99" with a long string reply (%d bytes):\n  "%s"', long_string.length, long_string );

log( '-> using: "%s" parser.', Spade( spade_opt ).parser.hreader ? 'HIREDIS NATIVE' : 'BORIS JS' );

add();