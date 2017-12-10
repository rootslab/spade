/* 
 * Spade GEORADIUS example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        log( 'ex.: cback gets:', err, fn( data[ 0 ] ) );
    }
    , key = 'Sicily'
    , gpoints = [ 13.361389, '38.115556', 'Palermo', 15.087269, 37.502669, 'Catania' ]
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
            client.commands.georadius( key, 15, 37, 200, 'km', options, function( err, data, fn ) {
                if ( err ) {
                    log( 'redis -ERR reply to GEORADIUS!', data );
                    return;
                }
                log( 'reply', data );
            } );
        } );
    } );
} );

client.connect( null);