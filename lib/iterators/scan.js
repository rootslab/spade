/*
 * SCAN, HSCAN, ZSCAN iterators iterators.
 */

module.exports = function ( client ) {
    var Bolgia = require( 'bolgia' )
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , iterators = client.iterators

    client.iterators.scan = function ( cursor, opt, cback ) {
        var options = improve( { match : null, count : 10 }, opt )
            , ccur = -1
            , icnt = 0
            , done = typeof cback === 'function' ? cback : function () {}
            , iterator = {
                next : function () {
                    cmd.scan( ~ ccur ? ccur : 0, options, function ( is_err_reply, data, fn ) {
                        ccur = data[ 0 ];
                        done( is_err_reply, [ ccur === 0, data[ 1 ], ++icnt ], fn );
                    } );
                }
            }
            ;
        return iterator;
    };

};