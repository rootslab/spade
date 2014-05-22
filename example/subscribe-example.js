/* 
 * Spade SUBSCRIBE Example
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

client.on( 'message', function ( data ) {
    log( 'data received;', data );
} );

client.on( 'ready', function () {
    client.commands.subscribe( [ 'a', 'a', 'b', 'b', 'c', 'c' ], function ( err, data, fn ) {
    // client.commands.subscribe( 'a', function ( err, data, fn ) {
    // client.commands.subscribe( null, function ( err, data, fn ) {
        log( 'sub result:', fn( data ) );
    } );
    setTimeout( function () {
        client.commands.unsubscribe();
        setTimeout( function () {
            client.commands.ping( function ( err, data, fn ) {
                log( 'ping:', fn( data ) );
                client.commands.quit( function ( err, data, fn ) {
                    log( 'quit:', fn( data ) );
                } );
            } );
        }, 4000 );
    }, 4000 );
} );

client.connect();