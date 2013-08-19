/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

var global = {fred : 1};

var n = 4;
var something = [3];

var fredf = function (jack, jill, data) {
    jack += 1;
    this.jack = jack;
    jill.push(5);
    this.jill = jill;
    this.fred += data.inc;
};

emitter.on("fires",  [global, fredf, n, something]);

emitter.emit("fires", {inc : 3});

emitter.log.print();
console.log(global, n, something);