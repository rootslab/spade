#!/usr/bin/env node
( function () {
    var log = console.log
        , assert = require( 'assert' )
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
        // collect error
        , err_counter = 0
        , printAssertionError = function ( e ) {
            log( '\n\n !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ' );
            log( ' !!!!!!!!! ASSERTION ERROR !!!!!!!!! ' );
            log( ' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! \n' );
            log( '%s\n', inspect( e ) );
            log( ' ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n ' );
        }
        , printLoadError = function ( e ) {
            log( '\n\n !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
            log( ' !!!! TEST FILE LOAD ERROR !!!!' );
            log( ' !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' );
            log( ' message: %s\n\n stack: %s', inspect( e.message ), inspect( e.stack.split('\n' ) ) );
            log( '\n ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\n' );
        }
        , pushError = function ( fname, err ) {
            if ( ! failed[ fname ] ) failed[ fname ] = [];
            err.timestamp = Date.now();
            failed[ fname ].push( err );
            ++err_counter;
        }
        , assertions = function ( test_name ) {
            return {
                isDeepEqual : function () {
                    try { 
                        assert.deepEqual.apply( null, arguments );
                    } catch ( e ) {
                        pushError( test_name, e );
                        printAssertionError( e );
                    }
                }
                , isOK : function () {
                    try { 
                        assert.ok.apply( null, arguments );
                    } catch ( e ) {
                        pushError( test_name, e );
                        printAssertionError( e );
                    }
                }
                , isEqual : function () {
                    try { 
                        assert.equal.apply( null, arguments );
                    } catch ( e ) {
                        pushError( test_name, e );
                        printAssertionError( e );
                    }
                }
            };
        }
        , failed = {}
        ;

    // catch SIGINT
    process.on( 'SIGINT', function () {
        log( '\n (SIGINT) Stopping tests...\n' );
        process.exit( 0 );
    } );

    fs.readdir( tpath,  function ( err, files ) {
        if ( err ) throw err;
        var flen = files.length
            , fname = files[ 0 ]
            , f = 0
            , fails = 0
            , errors = 0
            , success = 0
            , loaded = 0
            , finished = 0
            , queue = []
            , qpos = 0
            , stime = -1
            , etime = -1
            , done = function ( wait ) {
                if ( ++finished < success ) return setTimeout( next, wait || 500 );
                etime = Date.now();
                log( '\n %s test %s loaded.', inspect( loaded ), loaded > 1 ? 'files were' : 'file was' );
                if ( fails ) log( ' %s test %s not loaded.', inspect( fails ), fails > 1 ? 'files were' : 'file was' );
                log( ' %s test %s executed.', inspect( success ), success > 1 ? 'files were' : 'file was' );
                if ( err_counter ) log( err_counter === 1 ? ' %s error was encountered in:  %s.' : ' %s errors were encountered in %s.', inspect( err_counter ), inspect( Object.keys( failed ) ) );
                log( ' \n time elapsed: %s secs.\n', inspect( + ( ( etime - stime ) / 1000 ).toFixed( 2 ) ) );
            }
            , next = function () {
                var t = qpos + 2 >>> 1
                    , tot = queue.length >>> 1
                    , tname = null
                    , tfn = null
                    ;
                if ( qpos < queue.length ) {
                    tname = queue[ qpos++ ];
                    tfn = queue[ qpos++ ];
                    log( '\n[%s/%s][ %s v%s - %s ]\n', inspect( t ), inspect( tot ), mname, mver, inspect( tname ) );
                    // run script
                    tfn( done, assertions( tname ) );
                }
            }
            ;
        // load file list
        for ( ; f < flen; fname = files[ ++f ] ) {
            // load only test files
            if ( ~ fname.indexOf( '-test.js' ) ) {
                ++loaded;
                try { 
                    // load script
                    queue.push( fname, require( './' + fname ).test );
                    ++success;
                } catch ( e ) {
                    ++fails;
                    pushError( fname, e );
                    printLoadError( e );
                }
            }
        }
        // start
        stime = Date.now();
        next();
    } );

} )();