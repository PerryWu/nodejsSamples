var spawn        = require('child_process').spawn
var EventEmitter = require('events').EventEmitter
var inherits     = require('util').inherits
var es           = require('event-stream')
var through      = require('through')


// P: Make MpgPlayer has EventEmitter methods
inherits(MpgPlayer, EventEmitter)

module.exports = MpgPlayer

function MpgPlayer() {
	var self = this
	this.child = spawn('mpg123', ['-R'])	// P: With -R, mpg123 will output raw info to its standard out
	this.stream = this.child.stdin,
	this.child.stdout
	.pipe(es.split())	// P: es.split will split new line which mean next pipe will get single line to handle.
	.pipe(through(function (data) {
		var line = data.split(' ')	// P: "@P 2" will become [@P, 2]
		var type = line.shift()		// P: remove first element from array.

		if('@P' === type) {
			// P:+line.shift() will be index number so that event will be one of "end, pause, resume, stop"
			var event = ['end', 'pause', 'resume', 'stop'][+line.shift()]	
			// P: emit the event out so that others can take their actions.
			self.emit(event)	
		}
		else
		if('@E' == type) {
			var err = new Error(line.join(' '))
			err.type = 'mpg-player'
			self.emit('error', err)
		}
		else
		if('@F' == type) {
			line.unshift('frame')
			self.emit.apply(self, line)
		}

	}))

}


// P: use the prototype to setup the extra APIs.
var p = MpgPlayer.prototype

p._cmd = function () {
	// P: use array's API slice to have args in array.
	var args = [].slice.call(arguments)
	// P: will becomes "LOAD file\n" or "PAUSE\n" or "STOP\n" or "GAIN 100\n"
	this.stream.write(args.join(' ') + '\n')
	return this
}

p.play = function (file) {
	return this._cmd('LOAD', file)
}
p.pause = function () {
	return this._cmd('PAUSE')
}
p.stop = function () {
	return this._cmd('STOP')
}
p.gain = function (vol) {
	vol = Math.min(Math.max(Math.round(vol), 0), 100)
	return this._cmd('GAIN', vol)
}

p.close = function () {
	this.child.kill()
}


if(!module.parent) {
	new MpgPlayer()
	.play(process.argv[2])
}
