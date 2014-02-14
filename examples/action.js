/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    glob = {glob:"hi"};

emitter.makeLog();

emitter.action("firing test 2", function (data, emitter, ev, args) {
    var g = this;
    g.record = 2;
    console.log("g", g, "data", data, "ev", ev, "args", args);
    emitter.emit("test 2 fired", [data.msg, args.recipient]);
});

emitter.on("test 1 fires", ["firing test 2", "test 1 fired"], glob, {recipient: "king"});

emitter.on("test 1 fired", function () {console.log("test 1 done!");});

emitter.emit("test 1 fires", {msg: "See you tonight."});

emitter.log.print();

console.log(glob);