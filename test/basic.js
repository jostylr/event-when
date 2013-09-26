/*global require, console*/
var EventWhen = require('../index.js'),
    Test = require('./test.js'),
    emitter = new EventWhen();

var output = [
    "first fires",
    "second fires"
    ],
    input = [];

emitter.on("first ready", function () {
    input.push("first fires");
    emitter.emit("second ready");
});

emitter.on("second ready", function () {
    input.push("second fires");
});

emitter.emit("first ready");

console.log(Test.same(input, output));