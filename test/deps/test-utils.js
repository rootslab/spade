module.exports = ( function () {
var log = console.log
    , util = require( 'util' )
    , Bolgia = require( 'bolgia' )
    , doString = Bolgia.doString
    , improve = Bolgia.improve
    , ooo = Bolgia.circles
    , ostr = ooo.str
    , oarr = ooo.arr
    , inspect = util.inspect
    , keys = Object.keys
    , iopt = {
        showHidden : false
        , depth : 3
        , colors : true
        , customInspect : true 
    }
    , inspect = function ( arg, opt ) {
        return util.inspect( arg, improve( opt, iopt ) );
    }
    , format = function ( ename, args ) {

        if ( doString( ename ) !== ostr ) return;
        if ( doString( args ) !== oarr ) return;

        switch ( ename ) {

            // oerr, command object with error
            case 'error':
                return inspect( [ args[ 0 ].cmd, args[ 0 ].err ], iopt );

            // script_list
            case 'cacheinit':
                return inspect( [ args[ 0 ].length ], iopt );

            // script_name, error_msg
            case 'scriptfailure':
                return inspect( args, iopt );

            // lua_script_cache
            case 'cacheready':
                return inspect( keys( args[ 0 ].cache ), iopt );

            // password, reply, address
            case 'authorized':
            case 'authfailed':

            // db, reply, address
            case 'dbselected':
            case 'dbfailed':

            // script_name, data, txt
            case 'cacheload':
                return inspect( args.slice( 0, 2 ), iopt );

            // address
            case 'connect':
            case 'offline':
            case 'lost':
            case 'ready':
                return inspect( [ args[ 0 ].host, args[ 0 ].port ], iopt );

            // timeout, address
            case 'timeout':
                return inspect( args[ 0 ], iopt ); 

            // attempt, ms, address
            case 'attempt':
                return inspect( args.slice( 0, 2 ).concat( [ [ args[ 2 ].host, args[ 2 ].port ] ] ), iopt );

            // message, formatter
            case 'monitor':
                return inspect( args.slice( 0, 1 ), iopt );

            // message
            case 'message':
                return inspect( args.slice( 0, 1 ), iopt );

            // listen
            case 'listen':
                return inspect( args, iopt );

            // shutup
            case 'shutup':
                return inspect( args, iopt );

            case 'reply':
                return inspect( [ args[ 0 ], args[ 1 ].cmd, args[ 2 ] ], iopt );

            // object commands, queue_size
            case 'queued':
                return inspect( [ args[ 1 ], args[ 0 ].cmd, args[ 0 ].ecmd ], iopt );

            // queue_size
            case 'scanqueue':
                return inspect( args, iopt );

            default:
                return inspect( args, iopt );
        };
    }
    ;

    return {
        format : format
        , inspect : inspect
    };

} )();
