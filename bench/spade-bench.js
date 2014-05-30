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
        s = new Spade();
        list[ i ] = s;
        s.on( 'ready', enqueue );
    };
    for ( ; --i >= 0; ) {
        list[ i ].connect();
    };
};

run();