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

emitter.on("all tests on string", function (data) {
    console.log("all tests done string:", data.me);
});

emitter.on("all tests on array", function (data) {
    console.log("all tests done array:", data.me);
});

emitter.emitWhen("all tests on string", ["test 1 on", "test 2 on"]);
emitter.emitWhen(function (data) {
   console.log("directly function:", data.me);    
}, ["test 1 on", "test 2 on"]);
emitter.emitWhen(["all tests on array", function (data) {
   console.log("directly array:", data.me);    
}],  ["test 1 on", "test 2 on"]);

emitter.emit("test 1 on");

emitter.emit("test 2 on", {me: "rocks"});