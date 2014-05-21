/* 
 * Spade Transaction Rollback Example
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

client.commands.multi( function ( err, data, fn ) {
    log( 'multi:', fn( data ) );
} );

client.commands.ping( function ( err, data, fn ) {
    log( 'ping:', fn( data ) );
} );

client.once( 'ready', function (){
    log( 'ready' );
    setTimeout( function () {
        client.commands.exec( function ( err, data, fn ) {
            log( 'exec:', fn( data ) );
            // log( client.libra.cqueue );
        } );
    }, 5000 );
} );

setTimeout( function () {
    client.connect();
}, 3000 );