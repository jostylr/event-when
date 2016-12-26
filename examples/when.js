/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.on("alice", function a () {
});

emitter.on("bob", function b () {
});

emitter.once("alice rocks", function ar () {
});

emitter.on("both fired", function (data) {
    console.log("data events", data);
});

emitter.when(["alice", "bob"], 
    "both fired", true );

emitter.when(["alice", "bob"], 
    "first time for alice, bob");

emitter.when([["alice",2]], "alice fired twice");


emitter.emit("alice", "a1");
emitter.emit("alice", "a2");
emitter.emit("bob", {alice: "rocks"});

emitter.emit("alice", "a3");
emitter.emit("bob", {alice: "awesome"});

console.log(emitter.log.logs(["emitted", "Executing"]));
