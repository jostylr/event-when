/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.once("test 1", function () {
    console.log("test 1 fires");
    emitter.emit("test 2");
});

emitter.once("test 2", function() {
    console.log("actually does fire, once means at least once");
}, 0);

emitter.once("test 2", function () {
    console.log("test 2 fires");
}, 2);

emitter.once("test 2", function() {
    console.log("impatient test 2 handler");
}, 4, true);

emitter.once("test 2", function() {
    console.log("last test 2 handler");
}, 4);

emitter.emit("test 1");
emitter.emit("test 2");
emitter.emit("test 1");
emitter.emit("test 2");
emitter.emit("test 1");
emitter.emit("test 2");
emitter.emit("test 2");
emitter.emit("test 2");
emitter.emit("test 2");

emitter.log.print();