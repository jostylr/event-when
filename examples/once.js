/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.once("test 1", function t1 () {
    emitter.emit("test 2");
});


// it will not fire!
emitter.once("test 2", function t2a () {
}, 0);

emitter.once("test 2", function t2b () {
}, 2);

emitter.once("test 2", function t2c () {
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


console.log(emitter.log.logs(["emitted", "Executing"]));
