/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    f;

emitter.makeLog();

emitter.on("test 1 on", function () {
    console.log("test 1 starts");
    emitter.emit("test 1 finishes");
});

f = emitter.last;

emitter.on("test 1 finishes", function () {
    console.log("test 1 finishes");
    emitter.off("test 1 on", f);
    emitter.emit("test 1 on");
});

emitter.emit("test 1 on");

emitter.log.print();