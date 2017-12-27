/*jshint eqnull:true,esversion:6 */
/*global require, process, console */

var n = parseFloat(process.argv[2], 10) || 5e5;
const EvW = require('./index.js');
var EE = require("events").EventEmitter; 

var i, time, c;

var log = function (time, count, tag) {
    var diff = process.hrtime(time);
    console.log("##", tag);
    console.log("count", count);
    console.log('benchmark took ' + diff[0] + ' seconds and ' +
        diff[1]*1e-6 + ' milliseconds');
};

console.log(process.memoryUsage());

c = 0;

    emitter = new EE();

    emitter.on("go", function (num) {
        c += num;
    });

    time = process.hrtime();
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go", 1);
    }

    log(time, c, "native");
console.log(process.memoryUsage());

c = 0;
var emitter = new EvW();

emitter.loopMax = 2*n;


emitter.on("go", "add 1", function count (num) {
    c += num;
});
    
time = process.hrtime();

for (i = 0; i < n; i += 1) {
    emitter.emit("go", 1);
}

log(time, c, "event-when");
console.log(process.memoryUsage());

emitter = new EvW();

emitter.loopMax = 2*n;

emitter.scope('c', {a:0});

emitter.action('add', function count (num, scope, context) {
    context.a += num;
});

emitter.on("go", "add:c");

time = process.hrtime();

for (i = 0; i < n; i += 1) {
    emitter.emit("go", 1);
}

log(time, emitter.scope('c').a, "event-when scope");
console.log(process.memoryUsage());

emitter = new EvW();

emitter.loopMax = 2*n;

emitter.scope('numbers', {c:0});

emitter.action('add', function count (num, s) {
    o = this.emitter.scope(s);
    o.c += num; 
});

emitter.on("go", "add");

time = process.hrtime();

let a = {c:1};

for (i = 0; i < n; i += 1) {
    emitter.emit("go:numbers", 1);
}

log(time, emitter.scope('numbers').c, "event-when embedded scope");
console.log(process.memoryUsage());
