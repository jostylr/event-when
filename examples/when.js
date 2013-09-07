/*global require, console, process*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

var log = [];

emitter.on("alice fires", function () {
    log.push("alice fired");
});

emitter.on("bob fires", function () {
    log.push("bob fired");
});

emitter.once("alice rocks", function () {
    log.push("alice rocks");
});

emitter.on("string notes both fired", function (data) {
    log.push("from a string, both have fired " + data.alice);
});

emitter.on("array notes both fired", function (data) {
    log.push("string in an array, both have fired with data " + data.alice );
});

emitter.when(["alice fires", "bob fires"], "string notes both fired", true);
emitter.when(["alice fires", "bob fires"], function (data) {
    log.push("single function fires with data " + data.alice); 
});
emitter.when( ["alice fires", "bob fires"], ["array notes both fired", function (data) {
    log.push("array function fires data " + data.alice);
}]);
emitter.when([["alice fires",2]], function (data) {
    log.push("alice fired twice with data " + data.alice );
});
emitter.when("bob fires", function () {
    log.push("just care about bob firing");
});

emitter.on("done", function () {
    // console.log(data); 
});

emitter.on("near first", function () {
    log.push("called immediately");
});

console.log("all", emitter.events());

var evs; 
console.log("alice", (evs = emitter.events("alice") ) );
console.log("handles", emitter.handlers(evs));

console.log("not alice", emitter.events("alice", true));

emitter.emit("alice rocks");
emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "rocks"});

emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "awesome"});

emitter.emit("done", log);

emitter.emit("near first", {}, true); 

process.on("exit", function () {
    console.log("all", emitter.events());
    emitter.log.print();
    console.log(log);
});