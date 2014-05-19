/* 
 * Spade Example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        log( 'ex.: cback gets:', err, fn( data[ 0 ] ) );
    }
    , i = 0
    ;

client.on( 'ready', function () {
    while ( ++i <= 100 ) {
        client.commands.lpush( 'list1', 'ambarabàcciccìcoccò', cback );
    };
    setTimeout( function () {
        client.commands.lrange( 'list1', 1, 3, function ( err, data, fn ) {
            log( fn( data ) );
        } )
    }, 4000 );
} );

client.connect();