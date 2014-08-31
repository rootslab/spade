/*
 * SCAN, HSCAN, SSCAN, ZSCAN iterators.
 */

module.exports = function ( client ) {

    var Bolgia = require( 'bolgia' )
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , iterators = client.iterators
        , logger = client.logger
        , commands = client.commands
        , scan_opt = {
            match : null
            , count : 10
        }
        , scankeys = function ( cname ) {
            var sscanFn = function ( key, cursor, opt, cback ) {
                    var options = improve( clone( opt ), scan_opt )
                        , ckeys = null
                        , ccur = -1
                        , icnt = 0
                        , kcnt = 0
                        , done = typeof cback === 'function' ? cback : function () {}
                        , sscan = function () {
                            commands[ cname ]( key, ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                                var end = data[ 0 ] === 0
                                    ;
                                ccur = end ? -1 : data[ 0 ];
                                ckeys = data[ 1 ];
                                // emit debug event
                                if ( logger.events ) client.emit( cname, end, ++icnt, kcnt += ckeys.length, key );
                                // execute callback
                                done( is_err_reply, [ end, ckeys, icnt, kcnt, key ], sscan );
                                // reset counters
                                if ( end ) kcnt = icnt = 0;
                            } );
                        }
                        ;
                    return { next : sscan };
                }
                , hscanFn = function ( key, cursor, opt, cback ) {
                    var options = improve( clone( opt ), scan_opt )
                        , ckeys = null
                        , ccur = -1
                        , icnt = 0
                        , kcnt = 0
                        , done = typeof cback === 'function' ? cback : function () {}
                        , hscan = function () {
                            commands.hscan( key, ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                                var end = data[ 0 ] === 0
                                    ;
                                ccur = end ? -1 : data[ 0 ];
                                ckeys = data[ 1 ];
                                // emit debug event
                                if ( logger.events ) client.emit( 'hscan', end, ++icnt, ( kcnt += ckeys.length ) >>> 1, key );
                                // execute callback
                                done( is_err_reply, [ end, ckeys, icnt, kcnt >>> 1, key ], hscan );
                                // reset counters
                                if ( end ) kcnt = icnt = 0;
                            } );
                        }
                        ;
                    return { next : hscan };
                }
                , scanFn = function ( cursor, opt, cback ) {
                    var options = improve( clone( opt ), scan_opt )
                        , ckeys = null
                        , ccur = -1
                        , icnt = 0
                        , kcnt = 0
                        , done = typeof cback === 'function' ? cback : function () {}
                        , scan = function () {
                            commands.scan( ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                                var end = data[ 0 ] === 0
                                    ;
                                ccur = end ? -1 : data[ 0 ];
                                ckeys = data[ 1 ];
                                // emit debug event
                                if ( logger.events ) client.emit( 'scan', end, ++icnt, kcnt += ckeys.length );
                                // execute callback
                                done( is_err_reply, [ end, ckeys, icnt, kcnt ], scan );
                                // reset counters
                                if ( end ) kcnt = icnt = 0;
                            } );
                        }
                        ;
                    return { next : scan };
                }
                ;
            switch ( cname ) {
                case 'scan':
                    return scanFn;
                case 'hscan':
                    return hscanFn;
                case 'sscan':
                case 'zscan':
                    return sscanFn;
            }
        }
        ;

    // push polling custom events for logging to console
    logger.push( false, [ 'scan', 'hscan', 'sscan', 'zscan' ] );

    // get handlers
    iterators.scan = scankeys( 'scan' );
    iterators.hscan = scankeys( 'hscan' );
    iterators.sscan = scankeys( 'sscan' );
    iterators.zscan = scankeys( 'zscan' );

};