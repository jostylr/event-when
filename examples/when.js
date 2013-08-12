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

emitter.on("string notes both fired", function (data) {
    log.push("from a string, both have fired " + data.alice);
});

emitter.on("array notes both fired", function (data) {
    log.push("string in an array, both have fired with data " + data.alice );
});

emitter.emitWhen("string notes both fired", ["alice fires", "bob fires"], true);
emitter.emitWhen(function (data) {
    log.push("single function fires with data " + data.alice); 
}, ["alice fires", "bob fires"]);
emitter.emitWhen(["array notes both fired", function (data) {
    log.push("array function fires data " + data.alice);
}],  ["alice fires", "bob fires"]);
emitter.emitWhen(function (data) {
    log.push("alice fired twice with data " + data.alice );
}, [["alice fires",2]]);
emitter.emitWhen(function () {
    log.push("just care about bob firing");
},  "bob fires");

emitter.on("done", function () {
    // console.log(data); 
});

emitter.on("near first", function () {
    log.push("called immediately");
});

emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "rocks"});

emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "awesome"});

emitter.emit("done", log);

emitter.emit("near first", {}, true); 

process.on("exit", function () {
    emitter.log.print();
    console.log(log);
});