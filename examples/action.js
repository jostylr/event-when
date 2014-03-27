/*global require, console*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    glob = {};

emitter.makeLog();

emitter.action("fire test 2", function (data, evObj) {
    var g = this;
    g.record = 2;
    evObj.emitter.emit("test 2", data.msg);
}, glob);

emitter.on("test 1", "fire test 2");

emitter.on("test 2", function t2 (data) {
    var g = this;
    console.log(data, g.record);
}, glob);

emitter.emit("test 1", {msg: "See you tonight."});

console.log(emitter.log.logs());