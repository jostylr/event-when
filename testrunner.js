/*global require, process*/
var EventWhen = require('./index.js'),
    test = require('tape');

test(' two on and some emits', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    /*emitter.log = function () {
        console.log(arguments);
    }*/

    var expected = [
    "first fires",
    "second fires"
    ],
        actual = [];

    emitter.on("done", "check equals", function () {
        s.deepEqual(actual, expected);
    });

    emitter.on("first ready", "test one", function () {
        actual.push("first fires");
        console.log("first seen");
        emitter.emit("second ready");
    });
    
    emitter.on("second ready", "test two", function () {
        actual.push("second fires");
        emitter.emit("done");
    });
    
    emitter.emit("first ready");

});

test('simple once test', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    /*emitter.log = function () {
        console.log(arguments);
    }*/

    var expected = [
    "first fires",
    "second fires",
    "second fires"
    ],
        actual = [];

    emitter.on("done", "check equals", function () {
        s.deepEqual(actual, expected);
    });

    emitter.once("first ready", "test one", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });
    
    
    emitter.once("second ready", "test two", 2, function () {
        actual.push("second fires");
    });
    
    
    emitter.emit("first ready");
    emitter.emit("first ready");    
    emitter.emit("second ready");
    emitter.emit("done");

});
