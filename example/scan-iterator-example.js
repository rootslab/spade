/* 
 * Spade SCAN iterator example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        if ( ! data[ 0 ] ) return iter.next();
        etime = Date.now();
        log( '\n- %s keys scanned through %s iterations.', data[ 3 ], data[ 2 ] );
        log( '- elapsed time: %d secs.\n', ( ( etime - stime ) / 1000 ).toFixed( 1 ) );
    }
    , iter = null
    , i = 0
    // Spade defualt options for SCAN ZSCAN HSCAN commands.
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

// push 200 test keys
for ( ; i < n; ++i ) client.commands.set( 'key:' + i, i );

client.connect();

// load files from iterators dir
client.loadIterators();

stime = Date.now();
// get a SCAN iterator
iter = client.iterators.scan( 0, opt, cback );

iter.next();