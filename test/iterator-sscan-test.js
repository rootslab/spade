#!/usr/bin/env node

/* 
 * Spade, SSCAN iterator test.
 */
exports.test = function ( done, assertions ) {

    var debug = !! true
        , isArray = Array.isArray
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , test_utils = require( './deps/test-utils' )
        , inspect = test_utils.inspect
        , format = test_utils.format
        , Spade = require( '../' )
        , client = Spade( {
            security : {
                '127.0.0.1:6379' : {
                    requirepass : ''
                    , db : -1
                }
            }
        } )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        , i = 0
        // Spade default options for SCAN ZSCAN HSCAN commands.
        , opt = {
            match : '♠:key:*'
            , count : 10
        }
        , n = 100
        , skey = '♠:set:1'
        , cback = function ( err, data, iterate ) {
            // if ( ! data[ 0 ] ) return iterator.next();
            if ( ! data[ 0 ] ) return iterate();

            log( ' - check if last scan iteration returns an array: %s.', inspect( data[ 1 ]) );
            assert.ok( isArray( data[ 1 ] ) );

            log( '- check returned values form the last SSCAN iteration,' );

            log( '- iterations counter should be: %s < %s <= %s,', inspect( 0 ), inspect( data[ 2 ] ), inspect( n ) );
            assert.ok( data[ 2 ] && ( data[ 2 ] <= n ) );

            log( '- keys counter should be: %s,', inspect( n ) );
            assert.ok( data[ 3 ] === n, 'got: ' + inspect( data[ 3 ] ) );

            log( '- %s keys scanned through %s iterations.', inspect( data[ 3 ] ), inspect( data[ 2 ] ) );

            log( '- now disconnecting client with QUIT.' );

            client.commands.quit( function () {
                log( '- OK, client was disconnected.' );
                exit();
            } );
        }
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )

    // enable cli logging
    client.cli();

    client.commands.flushdb();

    // push 1000 test keys to force multiple iterations with COUNT
    for ( ; i < n; ++i ) client.commands.sadd( skey, '♠:key:' + i, i );

    client.connect();

    // load files from iterators dir
    client.loadIterators();

    stime = Date.now();
    // get a SSCAN iterator
    client.iterators.sscan( skey, 0, opt, cback ).next();
};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();