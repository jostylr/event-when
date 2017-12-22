/*global require, process, console */

var n = parseFloat(process.argv[2], 10) || 5e5;

var i, time, c;

var log = function (time, count, tag) {
    var diff = process.hrtime(time);
    console.log("##", tag);
    console.log("count", count);
    console.log('benchmark took ' + diff[0] + ' seconds and ' +
        diff[1]*1e-6 + ' milliseconds');
};

console.log(process.memoryUsage());


var EvW = require('./index.js');
var emitter = new EvW();

emitter.loopMax = 2*n;

c = 0;

emitter.on("go", "add 1", function count () {
    c += 1;
});
    
time = process.hrtime();

for (i = 0; i < n; i += 1) {
    emitter.emit("go");
}

log(time, c, "event-when");
console.log(process.memoryUsage());

emitter = new EvW();

emitter.loopMax = 2*n;

emitter.scope('c', 0);

emitter.on("go", "add 1", function count (num, scope, emitter) {
    emitter.scope('c', emitter.scope('c')+num);
});
    
time = process.hrtime();

for (i = 0; i < n; i += 1) {
    emitter.emit("go:c", 1);
}

log(time, emitter.scope('c'), "event-when scope");
console.log(process.memoryUsage());

    var EE = require("events").EventEmitter; 

    emitter = new EE();

    emitter.on("go", function () {
        c += 1;
    });

    time = process.hrtime();
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go");
    }

    log(time, c, "native");
console.log(process.memoryUsage());
