/*
 * SCAN, HSCAN, ZSCAN iterators iterators.
 */

module.exports = function ( client ) {

    var Bolgia = require( 'bolgia' )
        , improve = Bolgia.improve
        , iterators = client.iterators
        , logger = client.logger
        , commands = client.commands
        , scankeys = function ( cname ) {
            var hzscanFn = function ( key, cursor, opt, cback ) {
                    var options = improve( { match : null, count : 10 }, opt )
                        , ckeys = null
                        , ccur = -1
                        , icnt = 0
                        , kcnt = 0
                        , done = typeof cback === 'function' ? cback : function () {}
                        , hzscan = function () {
                            commands[ cname ]( key, ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                                ccur = data[ 0 ] === 0 ? -1 : data[ 0 ];
                                ckeys = data[ 1 ];
                                // emit debug event
                                if ( logger.events ) client.emit( cname, key, ! ~ ccur, ++icnt, kcnt += ckeys.length );
                                // execute callback
                                done( is_err_reply, [ key, ! ~ ccur, ckeys, icnt, kcnt ], fn );
                            } );
                        }
                        ;
                        
                    return { next : hzscan }
                    ;
                }
                , scanFn = function ( cursor, opt, cback ) {
                    var options = improve( { match : null, count : 10 }, opt )
                        , ckeys = null
                        , ccur = -1
                        , icnt = 0
                        , kcnt = 0
                        , done = typeof cback === 'function' ? cback : function () {}
                        , scan = function () {
                            commands.scan( ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                                ccur = data[ 0 ] === 0 ? -1 : data[ 0 ];
                                ckeys = data[ 1 ];
                                // emit debug event
                                if ( logger.events ) client.emit( 'scan', ! ~ ccur, ++icnt, kcnt += ckeys.length );
                                // execute callback
                                done( is_err_reply, [ ! ~ ccur, ckeys, icnt, kcnt ], fn );
                            } );
                        }
                        ;
                        
                    return { next : scan }
                    ;
                }
                ;
            return ( cname === 'scan' ) ? scanFn : hzscanFn;
        }
        ;

    // push polling custom events for logging to console
    logger.push( false, [ 'scan', 'hscan', 'zscan' ] );
    // get handlers
    iterators.scan = scankeys( 'scan' );
    iterators.hscan = scankeys( 'hscan' );
    iterators.zscan = scankeys( 'zscan' );

};