var EvW = require('./index.js');
var emitter = new EvW();

var n = process.argv[2] || 1e3;

var log = function (time, count, tag) {
    var diff = process.hrtime(time);
    console.log("##", tag);
    console.log("count", count);
    console.log('benchmark took ' + diff[0] + ' seconds and ' +
        diff[1]/1e6 + ' milliseconds');
};

var second = function () {
     
        var EE = require("events").EventEmitter; 
     
        var emitter = new EE();
    
        var c = 0;
    
        var time;
    
        emitter.on("go", function () {
            c += 1;
            if (c <= n) {
                emitter.emit("go");
            } else {
                log(time, c, "native");
            }
        });
    
        time = process.hrtime();
        
        emitter.emit("go");
    };

var c = 0;

emitter.loopMax = 1e5;

var time;

emitter.on("go", function () {
    c += 1;
    if (c <= n) {
        emitter.emit("go");
    } else {
        log(time, c, "event-when");

        if (n <= 6e3) {
            console.log("starting native");
            second();
        } else {
            console.log("skipping native as call stack may be exceeded" +
            " above 6000 trials");
        }
    }
});

time = process.hrtime();

emitter.emit("go");