/* 
 * Spade SSCAN iterator example
 */

var log = console.log
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, iterate ) {
        // if ( ! data[ 0 ] ) return iterator.next();
        if ( ! data[ 0 ] ) return iterate();
        etime = Date.now();
        log( '\n- %s properties scanned from set key \'%s\' through %s iterations.', data[ 3 ], skey, data[ 2 ] );
        log( '- elapsed time: %d secs.\n', ( ( etime - stime ) / 1000 ).toFixed( 1 ) );
    }
    , i = 0
    // Spade default options for SCAN ZSCAN SSCAN HSCAN commands.
    , opt = {
        match : null
        , count : 10
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

// load files from iterators directory
client.loadIterators();

stime = Date.now();
// get a SSCAN iterator
client.iterators.sscan( skey, 0, opt, cback ).next();