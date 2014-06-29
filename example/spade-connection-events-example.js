/* 
 * Spade Connection Events Example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade( {
        socket : {
            connection : {
                timeout : 10000
            }
        }
    } )
    , cback = function ( err, data, fn ) {
    }
    ;

client.on( 'ready', function () {
    log( 'ready', arguments );
} );

client.on( 'timeout', function () {
    log( 'timeout', arguments );
} );

client.on( 'offline', function () {
    log( 'offline', arguments );
} );

client.on( 'lost', function () {
    log( 'lost', arguments );
} );

client.on( 'attempt', function ( n, dest, lapse ) {
    log( 'attempt', arguments );
});

client.on( 'error', function ( err, data ) {
    log( 'error', arguments );
} );

client.connect();