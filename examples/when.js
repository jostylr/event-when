/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();

emitter.on("test 1 on", function () {
    console.log("test 1 starts");
});

emitter.on("test 2 on", function () {
    console.log("test 2 starts");
});

emitter.on("test 1 finishes", function () {
    console.log("test 1 finishes");
});

emitter.on("all tests on", function (data) {
    console.log("all tests done:", data.me);
});

emitter.emitWhen("all tests on", ["test 1 on", "test 2 on"]);

emitter.emit("test 1 on");

emitter.emit("test 2 on", {me: "rocks"});