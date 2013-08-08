/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();

var log = [];
emitter.log = function () {
    //log.push(arguments);
};

emitter.on("alice fires", function () {
    log.push("alice fired");
});

emitter.on("bob fires", function () {
    log.push("bob fired");
});

emitter.on("string notes both fired", function (data) {
    console.log("woot");
    log.push("from a string, both have fired" + data.alice);
});

emitter.on("array notes both fired", function (data) {
    log.push("string in an array, both have fired with data " + data.alice );
});

emitter.emitWhen("string notes both fired", ["alice fires", "bob fires"], false, true);
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

emitter.on("done", function (data) {
    console.log(data); 
});

emitter.on("near first", function (data) {
    log.push("called immediately");
});

emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "rocks"});

emitter.emit("alice fires");
emitter.emit("bob fires", {alice: "awesome"});

emitter.emit("done", log);

emitter.emit("near first", {}, true); 

process.on('exit', function () {
    console.log(log);
});