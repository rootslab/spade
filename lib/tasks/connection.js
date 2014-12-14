/*
 * CONNECTION tasks mix-ins.
 */

module.exports = function ( client ) {

    var abs = Math.abs
        , emptyFn = function () {}
        , qq = client.qq
        // ping server, disconnect after a no-reply timeout
        , wait_ping_reply = false
        // polling task with PING
        , pollingFn = function ( done, msg, timeout, reconnect ) {
            var me = this
                , socket = me.socket
                , queue = me.queue
                , qstatus = queue.status
                , m = qstatus.monitoring
                , s = qstatus.subscription
                , t = qstatus.transaction
                , tout = timeout && typeof timeout ==='number' ? abs( timeout ) : 1000
                , ok = false
                , last_access = qstatus.last_access
                , encode = me.mixins.encode
                , retry = reconnect === undefined ? true : !! reconnect
                , next = typeof done === 'function' ? done : emptyFn 
                , cback = function ( is_err, data, fn ) {
                    ok = true;
                    wait_ping_reply = false;
                    // done
                    next();
                }
                , stop = function () {
                    // cback was not executed, then stop this task and force disconnection
                    qq.stop( 'polling' );
                    // emit hangup event
                    me.emit( 'hangup', s.active, m.active );
                    // end connection
                    if ( retry ) socket.end();
                    else socket.bye();
                }
                ;
            // (re-)enable timestamp option in queue
            queue.options.timestamps = true;
            // check if it is possible to send pings
            if ( ! me.ready || wait_ping_reply || t.on ) return;
            // check last update
            if ( Date.now() - qstatus.last_access < qq.ttable.polling.interval ) return;
            // block sending of other pings
            wait_ping_reply = true;
            // check if monitoring or subscription mode is active
            if ( s.active || m.active ) {
                // emit polling event
                me.emit( 'polling', s.active, m.active );
                /*
                 * Write a raw PING command to force a monitor or subscription message
                 * reply, in this way no PINGs will be added to command and rollback queue
                 * in subscription mode. 
                 */
                me.socket.write( msg ? encode( 'PING', msg ).ecmd : encode( 'PING', null ).ecmd );
                // force disconnection and re-connection after timeout
                setTimeout( function () {
                    ok = qstatus.last_access > last_access;
                    if ( ! ok ) stop();
                    wait_ping_reply = false;
                    // done
                    next();
                }, tout );
                return;
            }
            // emit polling event
            me.emit( 'polling', 0, 0 );
            // check legacy ping
            if ( msg ) me.commands.ping( msg, cback );
            else me.commands.ping( cback );
            // force disconnection and re-connection after timeout
            setTimeout( function () {
                if ( ! ok ) stop() & next();
                wait_ping_reply = false;
            }, tout );
        }
        ;

    // push polling custom events for logging to console
    client.logger.push( false, [ 'polling', 'hangup' ] );

    // add Cucu task
    qq.add( 'polling', pollingFn, [], client, 600 * 1000 );

}; 