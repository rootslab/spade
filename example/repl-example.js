/*
 * Readme interactive example
 */

// create a client instance with all commands (*)
var client = require( '../' )( { semver : '*' } )

//enable automatic console logging for events
client.cli()

// get info about a command via mixins (Syllabus) property
client.mixins.info('CoNfiG')

// you can also stick the #info method to all available commands
client.mixins.stick()

// now get info about a method/command
client.commands.ping.info()

// now get info about a nested method/command
client.commands.pubsub.numpat.info()

// ok stop, now execute the command
// client.commands.pubsub.numpat()

// ops, command is not sent but queued, then open client connection..
// client.connect()

// read your reply, then quit or disconnect
// client.commands.quit()
