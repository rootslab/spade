/* 
 * Spade SCAN iterator example
 */

var log = console.log
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, iterate ) {
        // if ( ! data[ 0 ] ) return iterator.next();
        if ( ! data[ 0 ] ) return iterate();
        etime = Date.now();
        log( '\n- %s keys scanned through %s iterations.', data[ 3 ], data[ 2 ] );
        log( '- elapsed time: %d secs.\n', ( ( etime - stime ) / 1000 ).toFixed( 1 ) );
    }
    , i = 0
    // Spade default options for SCAN ZSCAN SSCAN HSCAN commands.
    , opt = {
        match : null
        , count : 10
    }
    , n = 500
    , stime = -1
    , etime = -1
    ;

// enable cli logging
client.cli();

// client.commands.flushdb();

// push 500 test keys
for ( ; i < n; ++i ) client.commands.set( 'key:' + i, i );

client.connect();

// load files from iterators directory
client.loadIterators();

stime = Date.now();
// get a SCAN iterator
client.iterators.scan( 0, opt, cback ).next();