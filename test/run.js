#!/usr/bin/env node
( function () {
    var log = console.log
        , fs = require( 'fs' )
        , util = require( 'util' )
        , iopt = {
            showHidden : false
            , depth : 10
            , colors : true
            , customInspect : true 
        }
        , inspect = function ( el ) {
            return util.inspect( el, iopt );
        }
        , tpath = __dirname
        , minfo = require( '../package.json' )
        , mname = minfo.name.charAt( 0 ).toUpperCase() + minfo.name.slice( 1 )
        , mver = minfo.version
        ;

    // catch SIGINT
    process.on( 'SIGINT', function () {
        log( '\nExit tests with SIGINT.\n' );
        process.exit( 0 );
    } );

    fs.readdir( tpath,  function ( err, files ) {
        if ( err ) return 1;

        var flen = files.length
            , fname = files[ 0 ]
            , f = 0
            , failed = {}
            , fails = 0
            , success = 0
            , executed = 0
            , finished = 0
            , queue = []
            , qpos = 0
            , stime = -1
            , etime = -1
            , done = function ( wait ) {
                if ( ++finished < success ) return setTimeout( next, wait || 500 );
                etime = Date.now();
                // log( '\n%s files found.', inspect( flen ) );
                // log( '%s files skipped.', inspect( flen - executed ) );
                log( '\n %s test files executed.', inspect( executed ) );
                log( ' %s test files succeeded.', inspect( success ) );
                log( ' %s test files failed.%s', inspect( fails ), fails ? '\n' + inspect( failed, true, 10, true ) : '' );
                log( ' \n time elapsed: %s secs.\n', inspect( + ( ( etime - stime ) / 1000 ).toFixed( 2 ) ) );
            }
            , next = function () {
                if ( qpos < queue.length ) {
                    log( '\n[ %s v%s - %s ]\n', mname, mver, inspect( queue[ qpos++ ] ) );
                    queue[ qpos++ ]( done );
                }
            }
            ;
        // load file list
        for ( ; f < flen; fname = files[ ++f ] ) {
            // load only test files
            if ( ~ fname.indexOf( '-test.js' ) ) {
                ++executed;
                // run script
                try {
                    queue.push( fname, require( './' + fname ).test );
                    ++success;
                } catch ( e ) {
                    ++fails;
                    if ( ! failed[ fname ] ) failed[ fname ] = [];
                    failed[ fname ].push( e, Date.now() );
                }
            }
        }
        // start
        stime = Date.now();
        next();
    } );

} )();