// use Redis INFO reply
var log = console.log
    , util = require( 'util' )
    , hiredis = require( 'hiredis' )
    , Boris = require( 'boris' )
    , b = Boris()
    , hreader = new hiredis.Reader( { return_buffers : true } )
    , info_reply = "$1744\r\n# Server\r\nredis_version:2.8.6\r\nredis_git_sha1:6441a41f\r\nredis_git_dirty:0\r\nredis_build_id:bc6d87fd0909959d\r\nredis_mode:standalone\r\nos:Linux 3.11.0-20-generic x86_64\r\narch_bits:64\r\nmultiplexing_api:epoll\r\ngcc_version:4.8.1\r\nprocess_id:5424\r\nrun_id:9570db97c720fcef326fe408970ba207e956b214\r\ntcp_port:6379\r\nuptime_in_seconds:23783\r\nuptime_in_days:0\r\nhz:10\r\nlru_clock:1541784\r\nconfig_file:\r\n\r\n# Clients\r\nconnected_clients:2\r\nclient_longest_output_list:0\r\nclient_biggest_input_buf:0\r\nblocked_clients:0\r\n\r\n# Memory\r\nused_memory:522976\r\nused_memory_human:510.72K\r\nused_memory_rss:2248704\r\nused_memory_peak:521936\r\nused_memory_peak_human:509.70K\r\nused_memory_lua:33792\r\nmem_fragmentation_ratio:4.30\r\nmem_allocator:jemalloc-3.2.0\r\n\r\n# Persistence\r\nloading:0\r\nrdb_changes_since_last_save:0\r\nrdb_bgsave_in_progress:0\r\nrdb_last_save_time:1399526462\r\nrdb_last_bgsave_status:ok\r\nrdb_last_bgsave_time_sec:0\r\nrdb_current_bgsave_time_sec:-1\r\naof_enabled:0\r\naof_rewrite_in_progress:0\r\naof_rewrite_scheduled:0\r\naof_last_rewrite_time_sec:-1\r\naof_current_rewrite_time_sec:-1\r\naof_last_bgrewrite_status:ok\r\naof_last_write_status:ok\r\n\r\n# Stats\r\ntotal_connections_received:3\r\ntotal_commands_processed:7\r\ninstantaneous_ops_per_sec:0\r\nrejected_connections:0\r\nsync_full:0\r\nsync_partial_ok:0\r\nsync_partial_err:0\r\nexpired_keys:0\r\nevicted_keys:0\r\nkeyspace_hits:1\r\nkeyspace_misses:0\r\npubsub_channels:0\r\npubsub_patterns:0\r\nlatest_fork_usec:190\r\n\r\n# Replication\r\nrole:master\r\nconnected_slaves:0\r\nmaster_repl_offset:0\r\nrepl_backlog_active:0\r\nrepl_backlog_size:1048576\r\nrepl_backlog_first_byte_offset:0\r\nrepl_backlog_histlen:0\r\n\r\n# CPU\r\nused_cpu_sys:2.66\r\nused_cpu_user:4.82\r\nused_cpu_sys_children:0.00\r\nused_cpu_user_children:0.00\r\n\r\n# Keyspace\r\ndb0:keys=1,expires=0,avg_ttl=0\r\n\r\n"
    , rdata = new Buffer( info_reply )
    , hreply = null
    ;


b.on( 'end', function () {
    log( '\n- ok, buffer ends' );
} );

b.on( 'miss', function ( r, i ) {
    log( '- "%s" rule needs data, index: "%s"', r.cid, i );
} );

b.on( 'match', function ( e, d, convert ) {
    log( '\n- data match:', e ? ' (Redis error)' : '' );
    log( '- boris result:', util.inspect( convert( d ), false, 3, true ) );
} );

b.parse( rdata );

hreader.feed( info_reply );

hreply = hreader.get();
log( '- hiredis result:', util.inspect( [ hreply + '' ], false, 3, true ) );