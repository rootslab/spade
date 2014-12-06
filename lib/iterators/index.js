/*
 * Exports all files containing tasks.
 */

module.exports = function ( client, file_list ) {
    var isArray = Array.isArray
        , files = [
            'scan'
        ]
        , flist = isArray( file_list ) && file_list.length ? file_list : files.concat()
        , f = 0
        , flen = files.length
        , file = files[ 0 ]
        ;
    // load only files contained in the list
    // console.log( file, flist.indexOf( file ) )
    for ( ; f < flen; file = files[ ++f ] ) if ( ~ flist.indexOf( file ) ) require( './' + file )( client );
};
