

const { EventEmitter } = require('events');

if (!global.emitter) {
    global.emitter = new EventEmitter();
}
module.exports = global.emitter;
