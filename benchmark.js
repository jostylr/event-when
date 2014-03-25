var EvW = require('./index.js');
var emitter = new EvW();

var n = 5e4;
var c = 0;

emitter.loopMax = 1e5;

emitter.once("go", function () {
    c += 1;
    emitter.emit("go");
}, n);

emitter.when(["go", n], "done");

var time;

emitter.once("done", function () {
    var diff = process.hrtime(time);
    console.log("count", c);
    console.log('benchmark took ' + diff[0] + ' seconds and ' +
        diff[1]/1e6 + ' milliseconds');
});

time = process.hrtime();

emitter.emit("go");