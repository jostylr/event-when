/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    f;

emitter.makeLog();

f = emitter.on("test 1 on", function () {
    console.log("test 1 starts!");
    emitter.emit("test 1 finishes");
});

emitter.on("test 1 finishes", function () {
    console.log("test 1 finishes!");
    emitter.off("test 1 on", f);
    console.log("offed");
    emitter.emit("test 1 on");
});

emitter.emit("test 1 on");

emitter.log.print();
emitter.log.filter(function (str) {
    if (str.search("test 1") === -1) {
        return false;
    } else {
        return true;
    }
});