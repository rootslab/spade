/* 
 * Spade All Events
 */

var log = console.log
    , slice = Array.prototype.slice
    , util = require( 'util' )
    , Spade = require( '../' )
    , client = Spade( {
        security : {
            '127.0.0.1:6379' : {
                /*
                 * Use default password 'foobared' in your redis.conf and also
                 * here. The client then sends AUTH as the first command on
                 * (re)connection and 'authorized' or 'authfailed' events will
                 * be emitted.
                 */
                requirepass : ''
                /*
                 * db === -1, disables the sending of SELECT command on
                 * client (re)connection, then 'dbselect' or 'dbfailed'
                 * events, will be not emitted.
                 */
                , db : 0
            }
        }
    } )
    ;

client.initCache( null, { encrypt_keys : false } );

client.on( 'error', function ( err ) {
    log( '-> error', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'cacheload', function () {
    log( '-> cacheload', util.inspect(  slice.call( arguments ), false, 3, true ) );
} );

client.on( 'cacheready', function () {
    log( '-> cacheready', util.inspect(  slice.call( arguments ), false, 3, true ) );
} );

client.on( 'cacheinit', function () {
    log( '-> cacheinit', util.inspect(  slice.call( arguments ), false, 3, true ) );
} );

client.on( 'scriptfailure', function () {
    log( '-> scriptfailure', util.inspect(  slice.call( arguments ), false, 3, true ) );
} );

client.on( 'authfailed', function () {
    log( '-> authfailed', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'authorized', function () {
    log( '-> authorized', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'dbfailed', function () {
    log( '-> dbfailed', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'dbselected', function () {
    log( '-> dbselected', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'offline', function () {
    log( '-> offline' );
} );

client.on( 'lost', function () {
    log( '-> lost' );
} );

client.on( 'attempt', function ( n, dest, lapse ) {
    log( '-> attempt', n, lapse / 1000 );
} );

client.on( 'connect', function () {
    log( '-> connect', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.on( 'ready', function () {
    log( '-> ready', util.inspect( slice.call( arguments ), false, 3, true ) );
} );

client.connect();