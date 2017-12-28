#!/usr/bin/env node

/* 
 * Spade, pubsub mode events test with Promises
 */

exports.test = function ( done, assertions ) {

    var debug = !! true
        , emptyFn = function () {}
        , log = console.log
        , dbg = debug ? console.log : emptyFn
        , test_utils = require( '../../utils/test-utils' )
        , inspect = test_utils.inspect
        , format = test_utils.format
        , Spade = require( '../../../' )
        , client = Spade( {
            promisify : true
        } )
        // expected events
        , evts = []
        // collected events
        , collected = client.logger.collected
        // channels
        , channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
        , sub_cback_OK = 0
        , exit = typeof done === 'function' ? done : function () {}
        , assert = assertions || require( 'assert' )
        ;

    log( '- a new Spade client was created with default options.' );

    log( '- enable CLI logging.' );

    client.cli( true, function ( ename, args ) {
        dbg( '  !%s %s', ename, format( ename, args || [] ) );
    }, true );

    log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

    log( '- now connecting client.' );

    evts.push( 'connect', 'reply', 'dbselected', 'scanqueue', 'ready' );

    client.connect( null, function () {

        log( '- check collected events, should be:', inspect( evts ) );
        assert.deepEqual( collected.events, evts, 'got: ' + inspect( collected.events ) );

        // command Promises
        client.commands.subscribe( channels ).then( () => {

            log( '- I\'m SUBSCRIBE callback.' );
            sub_cback_OK = 1;
        
        } ).then( () => {
        
            log( '- try to execute a TIME command in pubsub mode.' );
            // push expected error event
            evts.push( 'error' );
            return client.commands.time();
        
        } ).spread( ( err, reply, fn ) => {
        
            log( '- TIME Promise should get a Redis error reply: %s.', fn( reply ) );
            assert.ok( err );
        
        } ).then( () => {
        
            // push expected message events
            evts.push( 'listen' );
            for ( let i = 0 ; i < channels.length; ++i ) evts.push( 'message' );
            // push expected message events
            evts.push( 'reply' );
        
        } ).then( () => {
        
            log( '- now disconnecting client with QUIT.' );
            // push expected connection event
            evts.push( 'offline', 'lost' );
            return client.commands.quit();

        } ).spread( ( err, reply, fn ) => {
        
            log( '- QUIT Promise should get OK.', fn( reply ) );
            assert.ok( fn( reply )[ 0 ] === 'OK' );
            log( '- OK, client was disconnected.' );

        } ).then( () => {
        
            log( '- check execution of SUBSCRIBE callback:', inspect( [ sub_cback_OK ] ) );
            assert.ok( sub_cback_OK === 1 );
        
        } ).then( () => {
        
            log( '- send a TIME command' );
            return client.commands.time();
        
        } ).spread( ( err, reply, fn ) => {
        
            log( '- TIME Promise should get a Redis error reply: %s.', fn( reply ) );
            assert.ok( err );
        
        } ).then( () => {
        
            log( '- check collected events for client disconnection, should be:', inspect( evts ) );
            assert.deepEqual( collected.events.slice( 0, evts.length ), evts, 'got: ' + inspect( collected.events ) );
        
            // exit from test
            exit();
        
        } ).catch( ( reason ) => {

            log( '! error reason:', reason );
        
        } );

    } );

};

// single test execution with node
if ( process.argv[ 1 ] === __filename ) exports.test = exports.test();