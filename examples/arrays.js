/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    glob = {};

emitter.makeLog();

emitter.on("first", [
    function f1 (data, evObj) {
        var g = this; 
        g.n = data.n;
        console.log(evObj.ev, g.n);
    },
    function f2 (data, evObj) {
        var g = this, 
            ev = evObj.ev, 
            emitter = evObj.emitter;

        console.log(g.n, ev);
        if ( g.n < 10) {
            emitter.emit(ev, {n:(g.n+1)});
        } else {
            emitter.emit("done");
        }    
    }], glob );

emitter.on("done", function d () {
    console.log("all done");
});

emitter.emit("first", {n: 5});

console.log(emitter.log.logs());
