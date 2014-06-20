/* 
 * Spade LUA Cache Example
 */

var log = console.log
    , util = require( 'util' )
    , inspect = util.inspect
    , Spade = require( '../' )
    , client = Spade( {} )
    , filename = 'test_reply.lua'
    ;

client.on( 'error', function ( ocmd ) {
    log( '\nerror', inspect( ocmd, false, 3, true ) );
} );

client.on( 'ready', function ( address ) {
    log( '\nready', inspect( address, false, 3, true ) );
} );

client.on( 'cacheload', function ( script, data, txt ) {
    log( '\ncacheload', inspect( arguments, false, 3, true ) )
})

client.on( 'cacheinit', function ( command_list ) {
    log( '\ncacheinit', inspect( arguments, false, 3, true ) )
} );

client.on( 'cacheready', function ( lua_cache ) {
    /*
     * All scripts are written to socket and processed by Redis.
     * NOTE: Errored scripts are not added to cache.
     * NOTE: LUA cache is an instance of Camphora module.
     */
    log( '\ncacheready', inspect( arguments, false, 3, true ) )
    var keys = [ 'c', 'i', 3, 4 ]
        , args = [ 'a', 'o', 999, 1000 ]
        , fn = function ( e, d, z ) {
            log( '\n' + filename + ' result is: ', z( d ) );
        }
        ;
    /*
     * 'test0.lua' contains: 
     * "return {KEYS[1],KEYS[2],ARGV[1],ARGV[2]}"
     */
    client.lua.script.run( filename, keys, args, fn );
} );

// init LUA script cache,
client.initCache();

client.connect();