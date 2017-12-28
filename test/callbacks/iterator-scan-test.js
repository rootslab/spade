#!/usr/bin/env node

/* 
 * Spade, SCAN iterator test.
 */
exports.test = function ( done, assertions ) {

    var debug = !! true
        , isArray = Array.isArray
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , test_utils = require( '../utils/test-utils' )
        , inspect = test_utils.inspect
        , format = test_utils.format
        , Spade = require( '../../' )
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
            , count : 1
        }
        , n = 10
        , cback = function ( err, data, iterate ) {
            if ( ! data[ 0 ] ) return iter.next();

            log( ' - check if last scan iteration returns an array: %s.', inspect( data[ 1 ]) );
            assert.ok( isArray( data[ 1 ] ) );

            log( '- check returned values form the last SCAN iteration,' );

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
        , iter = null
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;

    log( '- a new Spade client was created with default options:', inspect( client.options ) );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    client.commands.flushdb();

    log( '- SET %s keys for SCAN test.', inspect( n ) );

    for ( i = 0; i < n; ++i ) client.commands.set( '♠:key:' + i, i );

    log( '- load iterators.' );
    client.loadIterators();

    log( '- opening client connection.' );

    client.connect( null, function () {

        log( '- get a SCAN iterator with options: %s.', inspect( opt ) );
        iter = client.iterators.scan( 0, opt, cback );

        log( '- start iterations..' );
        iter.next();

    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename )exports.test = exports.test();
