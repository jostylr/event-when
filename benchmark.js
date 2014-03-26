var n = process.argv[2] || 1e3;

var i, time, c;

var log = function (time, count, tag) {
    var diff = process.hrtime(time);
    console.log("##", tag);
    console.log("count", count);
    console.log('benchmark took ' + diff[0] + ' seconds and ' +
        diff[1]/1e6 + ' milliseconds');
};

var EvW = require('./index.js');
var emitter = new EvW();

emitter.loopMax = 2*n;

c = 0;

emitter.on("go", function () {
    c += 1;
});
    
time = process.hrtime();

for (i = 0; i < n; i += 1) {
    emitter.emit("go");
}

log(time, c, "event-when");
   
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