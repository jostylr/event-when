/*jshint esversion: 6*/
/*global require, setImmediate, console*/
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

test('checking labels and onces', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    /*emitter.log = function () {
        console.log(arguments);
    }*/

    var expected = [
    "first fires",
    "second fires",
    "second second fires",
    "second fires",
    "always on",
    "always on",
    "always on"
    ],
        actual = [];

    emitter.on("done", "check equals", function () {
        s.deepEqual(actual, expected);
    });

    emitter.action("fire first",function () {
        actual.push("first fires");
        emitter.emit("second ready");
        emitter.on("second ready", "fire always", function () {
            actual.push("always on");
        });
    });
    
    emitter.action("fire second",  function () {
        actual.push("second fires");
    });
    
    emitter.once("first ready", "fire first");
    
    emitter.once("second ready", "fire second", 2);
    
    emitter.once("second ready", "double fire", function () {
        actual.push("second second fires");
    });
    
    
    emitter.emit("first ready");
    emitter.emit("first ready");    
    emitter.emit("second ready");
    emitter.emit("second ready");
    emitter.emit("second ready");
    emitter.emit("done");

});

test('turning off a handler', function (s) {
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

    var h = emitter.on("first ready", "fire first", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });
    
    emitter.on("second ready", "fire second", function () {
        actual.push("second fires");
    });
    
    emitter.emit("first ready");
    emitter.off("first ready", h);
    emitter.emit("first ready");    
    emitter.emit("second ready");
    emitter.off("second ready", "fire second");
    emitter.emit("second ready");
    
    emitter.emit("done");

});

test('max loop', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    /*emitter.log = function () {
        console.log(arguments);
    }*/

    var expected = [
    "start",
    "stopping",
    "1000"
    ],
        actual = [];

    emitter.on("done", "check equals", function () {
        s.deepEqual(actual, expected);
    });

    let count = 0;
    
    emitter.on("start", "emit loop", function () {
        actual.push("start");
        setImmediate( () => {
            actual.push("stopping");
            emitter.off("loop");
            emitter.emit("loop");
            emitter.emit("stopped");
        });
        emitter.emit("loop");
    });
    
    emitter.on("loop", "keep it going", function () {
        count += 1;
        emitter.emit("loop");
    });
    
    emitter.on("stopped", "store count", () => {
        actual.push(count.toString());
        emitter.emit("done");
    });
    
    emitter.emit("start");

});

test('when waiting for 2 events', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    /*emitter.log = function () {
        console.log(arguments);
    }*/

    var expected = [
    "when fired"
    ],
        actual = [];

    emitter.on("done", "check equals", function () {
        s.deepEqual(actual, expected);
    });

    emitter.when(["first ready", "second ready"], "both ready");
    
    
    emitter.on("both ready", "actual push", function () {
        actual.push("when fired");
    });
    
    emitter.emit("first ready");
    
    emitter.emit("first ready");
    emitter.emit("second ready");
    emitter.emit("first ready");    
    emitter.emit("second ready");
    
    emitter.emit("done");

});
