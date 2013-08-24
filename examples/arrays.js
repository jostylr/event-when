/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    glob = {};

emitter.makeLog();

emitter.on("first", [glob, function (data, emitter, ev) {
    var g = this; 
    var n = data.n;
    console.log(ev, n);
    g.seconder = function (data, emitter, ev) {
        n += 1;
        console.log(n, ev);
        if ( n < 10) {
            emitter.emit(ev);
        }
    };
    emitter.emit("second");
    }]
);

emitter.on("second", [glob, "seconder"]);

emitter.emit("first", {n: 5});

emitter.log.print();