/*
 * Exports all files containing tasks.
 */

module.exports = function ( client ) {
    var files = [
            'connection'
        ]
        , f = 0
        , flen = files.length
        , file = files[ 0 ]
        ;
    for ( ; f < flen; file = files[ ++f ] ) require( './' + file ).tasks( client );
};