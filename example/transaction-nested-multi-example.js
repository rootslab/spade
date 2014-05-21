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

client.on( 'ready', function () {
    client.commands.multi( function ( err, data, fn ) {
        log( 'multi:', fn( data )  );
        setTimeout( function () {
            client.commands.ping( function ( err, data, fn ) {
                log( 'ping:', fn( data ) );
                setTimeout( function () {
                    client.commands.multi( function ( err, data, fn ) {
                        log( 'multi:', fn( data ) );
                        setTimeout( function () {
                            client.commands.exec( function ( err, data, fn ) {
                                log( 'exec:', fn( data ) );
                                client.commands.quit( function ( err, data, fn ) {
                                    log( 'quit:', fn( data ) );
                                } );
                            } );
                        }, 2000 );
                    } );
                }, 2000 );
            } );
        }, 2000 );
    } );
} );

client.connect();