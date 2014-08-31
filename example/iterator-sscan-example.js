/* 
 * Spade SSCAN iterator example
 */

var log = console.log
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        if ( ! data[ 0 ] ) return iter.next();
        etime = Date.now();
        log( '\n- %s properties scanned from hash key \'%s\' through %s iterations.', data[ 3 ], skey, data[ 2 ] );
        log( '- elapsed time: %d secs.\n', ( ( etime - stime ) / 1000 ).toFixed( 1 ) );
    }
    , iter = null
    , i = 0
    // Spade default options for SCAN ZSCAN SSCAN HSCAN commands.
    , opt = {
        match : null
        , count : 1
    }
    , skey = 'skey'
    , n = 1000
    , stime = -1
    , etime = -1
    ;

// enable cli logging
client.cli();

// client.commands.flushdb();

// push 1000 test keys to force multiple iterations with COUNT
for ( ; i < n; ++i ) client.commands.sadd( skey, 'el:' + i, i );

client.connect();

// load files from iterators dir
client.loadIterators();

stime = Date.now();
// get a SSCAN iterator
iter = client.iterators.sscan( skey, 0, opt, cback );

iter.next();