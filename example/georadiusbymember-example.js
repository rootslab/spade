/* 
 * Spade GEORADIUSBYMEMEBER example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        log( 'ex.: cback gets:', err, fn( data[ 0 ] ) );
    }
    , key = 'Sicily'
    , gpoints = [ '13.583333', 37.316667, 'Agrigento' ]
    , options = {
        order : 'ASC'
        // , store : 'sicilia'
        , with : [ 'WITHCOORD', 'WITHDIST', 'WITHHASH' ]
    }
    ;

client.on( 'error', function ( ocmd ) {
    log( 'error', ocmd );
} );

client.on( 'ready', function () {
    client.commands.flushdb( false, function ( err, data, fn ) {
        if ( err ) {
            log( 'redis -ERR reply to FLUSHDB!', data );
            return;
        }
        log( 'flushdb', data );
        client.commands.geoadd( key, gpoints, function ( err, data, fn ) {
            log( 'geoadd', key, gpoints );
            log( 'reply', data );
            client.commands.georadiusbymember( key, 'Agrigento', 100, 'km', options, function( err, data, fn ) {
                if ( err ) {
                    log( 'redis -ERR reply to GEORADIUSBYMEMBER!', data );
                    return;
                }
                log( 'reply', data );
            } );
        } );
    } );
} );

client.connect( null);