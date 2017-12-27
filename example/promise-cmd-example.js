/* 
 * Spade promise example
 */

var log = console.log
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade()
    , cback = function ( err, data, fn ) {
        log( 'ex.: cback gets:', err, fn( data[ 0 ] ) );
    }
    , key = 'Sicily'
    , gpoints = [ 13.361389, 38.115556, 'Palermo', 15.087269, 37.502669, 'Catania' ]
    ;

client.on( 'error', function ( ocmd ) {
    log( 'error', ocmd );
} );

client.on( 'ready', function () {
    log( '\n- send FLUSHDB..' );
    client.commands.flushdb( false ).then( function ( arr ) {
        log( '- reply:', arr )
        log( '\n- send GEOADD' );
        return client.commands.geoadd( key, gpoints );
    } ).spread( function ( err, reply, fn ) {
        log( '- reply (spread):', reply );
        log( '\n- send PING..' );
        return client.commands.ping();
    } ).then( function ( arr ) {
        log( '- reply:', arr[ 1 ] );
        log( '\n- send QUIT..' );
        return client.commands.quit();
    } ).then( function ( arr ) {
        log( '- reply:', arr[ 1 ], '\n' );
    } );

} );

client.connect( null );