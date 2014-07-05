/* 
 * Spade MONITOR Example
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

client.on( 'monitor', function ( msg ) {
    log( 'MONITOR:', msg );
} );

client.on( 'ready', function () {
    client.commands.monitor( function ( err, data, fn ) {
        log( 'monitor:', fn( data ) );
        setTimeout( function () {
            client.commands.quit( function ( err, data, fn ) {
                log( 'quit:', fn( data ) );
            } );
        }, 4000 );
    } );
} );

client.connect();