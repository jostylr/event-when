/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    f;

emitter.makeLog();

f = emitter.on("test 1 on", function t1s () {
    emitter.emit("test 1 finishes");
});

emitter.on("test 1 finishes", function t1f () {
    emitter.off("test 1 on", f);
    emitter.emit("test 1 on");
});

emitter.emit("test 1 on");

console.log(emitter.log.logs());

console.log("just emits now:" ); 
console.log(emitter.log.logs("emitted"));