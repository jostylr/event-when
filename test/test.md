# Test files

This is a set of tests for this library to pass. 



## basic

This tests the basic emit--on functions


    function () {

        var emitter = new EventWhen();

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

        return Test.same(input, output);
    }


## once

This tests that the once removes itself. We do a case with no number and one with 2 attached. 

    function () {

        var emitter = new EventWhen();

        var output = [
            "first fires",
            "second fires",
            "second fires"
            ],
            input = [];
        

        emitter.once("first ready", function () {
            input.push("first fires");
            emitter.emit("second ready");
        });

        emitter.once("second ready", function () {
            input.push("second fires");
        }, 2);

        emitter.emit("first ready");
        emitter.emit("first ready");    
        emitter.emit("second ready");

        return Test.same(input, output);
    }

## off

This tests that we can remove handlers.

    function () {

        var emitter = new EventWhen();

        var output = [
            "first fires",
            "second fires",
            "second fires"
            ],
            input = [];
        

        var h = emitter.on("first ready", function () {
            input.push("first fires");
            emitter.emit("second ready");
        });

        emitter.on("first ready", function () {
            input.push("second fires");
        });

        emitter.emit("first ready");
        emitter.off("first ready", h);
        emitter.emit("first ready");    
        emitter.emit("second ready");

        return Test.same(input, output);
    }

## when

Testing the when capabilities.


    function () {

        var emitter = new EventWhen();

        var output = [
            "when fired"
            ],
            input = [];
        

        emitter.when(["first ready", "second ready"], function () {
            input.push("when fired");
        });

        emitter.emit("first ready");
        emitter.emit("first ready");    
        emitter.emit("second ready");
        emitter.emit("first ready");    
        emitter.emit("second ready");

        return Test.same(input, output);
    }

## action

Testing actions.

    function () {

        var emitter = new EventWhen();

        var output = [
            "first fired"
            ],
            input = [];
        

        emitter.action("fire the first one", function () {
            input.push("first fired");
        });

        emitter.on("first ready", "fire the first one");

        emitter.emit("first ready");

        return Test.same(input, output);
    }


## Handler with context

    function () {

        var emitter = new EventWhen();

        var expected = [
            "jt:hi!"
            ],
            actual = [];
        

        emitter.on("first ready", function (data, emitter, args) {
            var self = this;
            actual.push(self.name + ":" + args);
        }, {name:"jt"}, "hi!");

        emitter.emit("first ready");

        return Test.same(actual, expected);
    }

## Handler with two handles

Let's have a function that acts and then an event that emits saying it acted. 


    function () {

        var emitter = new EventWhen();

        var expected = [
            "jt:hi!",
            "action fired received"
            ],
            actual = [];
        

        emitter.on("first ready", [function (data, emitter, args) {
            var self = this;
            actual.push(self.name + ":" + args);
        }, "an action fired"], {name:"jt"}, "hi!");

        emitter.on("an action fired", function () {
            actual.push("action fired received");
        });

        emitter.emit("first ready");

        return Test.same(actual, expected);

    }

## Listing handlers and events

Can we filter events appropriately? 

    function () {

        var emitter = new EventWhen();

        var expected = [
            "first : great",
            "second",
            "first : great",
            "first : greatsecond",
            "works",
            "worksyadda"
            ],
            actual = [];
        

        emitter.on("first : great",  "works");

        emitter.on("second", "yadda");

        actual.push(emitter.events(":").join(''));

        actual.push(emitter.events(":", true).join(''));
     
        actual.push(emitter.events(function (ev) {
            if (ev === "first : great") {
                return true;
            } else {
                return false;
            }
        }).join(''));

        actual.push(emitter.events().join(''));

        actual.push(emitter.handlers(["first : great"])["first : great"][0].value[0]);

        // handlers
        (function () {
            var key, str='', hs; 
            hs = emitter.handlers();
            for (key in hs) {
                str += hs[key][0].value[0];
            }
            actual.push(str);
        } () );

        return Test.same(actual, expected);
    }

## Canceling

Can we remove handlers or stop events? 

    function () {

        var emitter = new EventWhen();

        var expected = [
            "emit this",
            "emit that 1",
            "emit that 2",
            "seen because the handler array is not stopped"
            ],
            actual = [];
        
        emitter.on("emit this", [function () {
                actual.push("emit this");
                return false;
            }, function () {
                actual.push("not actually ever seen");
        }]);

        emitter.on("emit that", [function () {
                actual.push("emit that 1");
        }]);


        emitter.on("emit that", [function (data, emitter) {
                actual.push("emit that 2");
                emitter.stop(true);
            }, function () {
                actual.push("seen because the handler array is not stopped");
        }]);

        emitter.on("emit that", [function () {
                actual.push("never seen as it gets canceled beforehand");
        }]);


        emitter.emit("emit this");
        emitter.emit("emit that");

        return Test.same(actual, expected);
    }

    

## [test.js](#test.js "save: |jshint")

This is the set of test functions one can use. Basic. 

    /*global module*/
    module.exports.same = function (inp, out) {
        var i, n = inp.length;

        if (inp.length !== out.length) {
            return false; 
        }

        for (i =0; i <n; i+=1 ) {
            if (inp[i] !== out[i]) {
                return false;
            }
        }
        return true;
    };

## [testrunner.js](#testrunner.js "save: |jshint")

This is a simple test runner. 


    /*global require, console*/
    var EventWhen = require('../index.js'),
        Test = require('./test.js');

    var tests = {
        "basic on/emit test" : _"basic",
        "simple once test" : _"once",
        "turning off a handler" : _"off",
        ".when waiting for 2 events" : _"when",
        "checking action naming" : _"action",
        "checking handlers and events" : _"Listing handlers and events",
        "handler with context" : _"handler with context",
        "Handler with two handles" : _"Handler with two handles",
        "canceling" : _"canceling"
    };

    var key, result, fail = 0;

    for (key in tests ) {
        result = tests[key]();
        if (result) {
            console.log("passed: " + key);
        } else {
            console.log("FAILED: " + key);
            fail += 1;
        }
    }

    if (fail) {
        throw(fail + " number of tests failed!");
    }