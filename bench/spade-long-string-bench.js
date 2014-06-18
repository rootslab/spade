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
    }
    ;

var sendCommands = function () {
    var i = 0
        , client = null
        ;

    stime = Date.now();

    for ( ; i < requests; ++i ) {
        client = list[ i % tclients ];
        client.commands.lrange( 'mylist', 0, 99, function () {
            // heapdump.writeSnapshot();
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
    };
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
    };
    for ( ; --i >= 0; ) {
        list[ i ].connect();
    };
};

var add = function () {
    var s = Spade( spade_opt )
        ;
    s.once( 'ready', function () {
        var i = 0
            , r = 0
            , n = 100
            ;
        for ( ; i < n; ++i ) {
            s.commands.lpush( 'mylist', long_string, function ( err, data, fn ) {
                if ( ++r === n ) {
                    s.commands.quit( run );
                }
            } );
        };
    } );
    s.connect();
};

log( '\n- using: "%s" parser', Spade( spade_opt ).parser.hreader ? 'hiredis' : 'Boris' );

log( '- benchmark LRANGE with a long string argument (%d bytes):\n  "%s"', long_string.length, long_string );

add();