/* 
 * Spade Dummy Example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        log( 'lpush cback gets:', err, fn( data ) );
    }
    , i = 0
    ;

client.on( 'ready', function () {
    while ( ++i <= 5 ) {
        client.commands.lpush( 'list1', 'ambarabàcciccìcoccò', cback );
    };
    setTimeout( function () {
        client.commands.lrange( 'list1', 1, 3, function ( err, data, fn ) {
            log( 'lrange:', fn( data ) );
            client.commands.quit( function ( err, data, fn ) {
                log( 'quit:', fn( data ) );
            } );
        } );
    }, 4000 );
} );

client.connect();