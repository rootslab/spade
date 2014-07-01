/* 
 * Spade Offline Queue Example
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

client.on( 'error', function ( ocmd ) {
    log( 'error', ocmd );
} );

client.commands.ping( function ( err, data, fn ) {
    log( 'ping:', fn( data ) );
} );

client.commands.keys( '*', function ( err, data, fn ) {
    log( 'keys:', fn( data )  );
} );

setTimeout( function () {
    client.connect();
    setTimeout( client.commands.quit, 2000 );
}, 3000 );