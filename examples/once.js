/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.once("test 1", function () {
    console.log("test 1 fires");
});

emitter.once("test 2", function () {
    console.log("test 2 fires");
}, 2);

emitter.emit("test 1");
emitter.emit("test 2");
emitter.emit("test 1");
emitter.emit("test 2");
emitter.emit("test 1");
emitter.emit("test 2");

emitter.log.print();