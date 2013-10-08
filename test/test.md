# Test files

This is a set of tests for this library to pass. 



## basic on/emit test

This tests the basic emit--on functions


    function () {

        var emitter = new EventWhen();
        var key = "basic on/emit test";

        var expected = [
            "first fires",
            "second fires"
            ],
            actual = [];
        
        _"async emitting";


        emitter.on("first ready", function () {
            actual.push("first fires");
            emitter.emit("second ready");
        });

        emitter.on("second ready", function () {
            actual.push("second fires");
            emitter.emit("done");
        });

        emitter.emit("first ready");

    }

## basic again

[sample.js](#basic-again "save: *test template")

This tests the basic emit--on functions

[key]()

    basic again


[expected]()

    first fires
    second fires

[code]()  
    
    emitter.on("first ready", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });

    emitter.on("second ready", function () {
        actual.push("second fires");
        emitter.emit("done");
    });

    emitter.emit("first ready");


## once

This tests that the once removes itself. We do a case with no number and one with 2 attached. 

[key]()

    simple once test


[expected]() 

    first fires
    second fires
    second fires


[code]()

    console.log("once setting up");

    emitter.once("first ready", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });

    emitter.once("second ready", function () {
        actual.push("second fires");
    }, 2);

    emitter.emit("first ready");
    emitter.emit("first ready");    
    emitter.emit("second ready");
    emitter.emit("done");

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

        emitter.on("emit this", [function () {
                actual.push("not seen either");
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

## Error checking

Let's throw an error.

    function () {

        var emitter = new EventWhen();

        var expected = [
            "error event:awesome\nChecking!",
            "Checking!\nerror event\nawesome"
            ],
            actual = [];

        // default error

        emitter.on("error event", function () {
            throw Error("Checking!");
        }).name = "awesome";


        try {
            emitter.emit("error event");
        } catch (e) {
            actual.push(e.message);
        }

        //error overide

        emitter.error = function (e, ev, h) {
            actual.push([e.message, ev, h.name].join("\n"));
        };

        emitter.emit("error event");

        return Test.same(actual, expected);
    }

## Flow testing

Do all the timing functions work? How do we handle asynchronous calls? 

    function () {

        var emitter = new EventWhen();
        var key = "flow testing";

        var expected = [
            ],
            actual = [];

        _"async emitting";

        emitter.on("done", function () {
            console.log(actual);
        });


        emitter.on("go", function () {

            emitter.emit("whenever");
            emitter.on("whenever", function () {
                actual.push("whenever: added after emit");
            });
            emitter.emit("nowish", {}, "now");
            emitter.on("nowish", function () {
                actual.push("nowish: added later");
            });
            emitter.emit("waiting", {}, "later");
            emitter.on("waiting", function () {
                actual.push("waiting: added later");
            });
            emitter.emit("whenever");
            emitter.emit("rushing", {}, "immediate");
            emitter.on("rushing", function () {
                actual.push("rushing: too late");
            });
            emitter.emit("done", {}, "later");

        });


        emitter.log = function (description) {
            if (description.indexOf("emitting:") !== -1) {
                actual.push(description.substr(10)); 
            }
        };

        ["whenever", "nowish", "waiting", "rushing"].forEach(function (el) {
            emitter.on(el, function () {
                actual.push(el +" handled");
            });
        });

        emitter.emit("go");

    }


## Async emitting

This is a snippet that should be placed at the end of each async function. 

    emitter.on("done", function () {
        var result;

        result = Test.same(actual, expected);
        if (result === true ) {
           tester.emit("passed", key);
        } else {
            tester.emit("failed", {key:key, result:result});
        }    
    })


## Test Template

This is the test template

    function () {

        var emitter = new EventWhen();
        var key = '_"*:key"';

        emitter.name = key;

        var expected = _"*:expected| arrayify",
            actual = [];
        
        _"async emitting";

        _"*:code"

        console.log("done with", key);

    }

## Arrayify

We define a command that takes a list of items separated by returns and makes an array out of them. The strings are trimmed and empty lines are ignored. This should allow for some whitespace formatting. 

    function (code) {
        var lines = code.split("\n");
        return '[\n"' + lines.filter(function (el) {
            if (el.length > 0) {
                return true;
            } else {
                return false;
            }
        }).map(function (el) {
            return el.trim();
        }).join('",\n"') + '"\n]';
    }

[arrayify](#arrayify "define: command | | now")


## [test.js](#test.js "save: |jshint")

This is the set of test functions one can use. Basic. 

    /*global module*/
    module.exports.same = function (inp, out) {
        var i, n = inp.length;

        if (inp.length !== out.length) {
            return inp;
        }

        for (i =0; i <n; i+=1 ) {
            if (inp[i] !== out[i]) {
                return "expected: "+out[i] + "\nactual: " +inp[i];
            }
        }
        return true;
    };

## [testrunner.js](#testrunner.js "save: |jshint")

This is a simple test runner. 


    /*global require, console, process*/
    var EventWhen = require('../index.js'),
        Test = require('./test.js'),
        tester = new EventWhen(),
        key;
        
    var records = {
"basic on/emit test" : _"basic on/emit test",
"basic again" : _"basic again*test template",
            "simple once test" : _"once*test template"
"turning off a handler" : _"off",
".when waiting for 2 events" : _"when",
"checking action naming" : _"action",
"checking handlers and events" : _"Listing handlers and events",
"handler with context" : _"handler with context",
"Handler with two handles" : _"Handler with two handles",
"canceling" : _"canceling",
"error checking" : _"error checking",
"flow testing" : _"flow testing"*/
    };

    tester.on("passed", _":passing");

    tester.on("failed", _":failing");

    for (key in records) {
        records[key]();
    }

    process.on('exit', function () {
        var n = Object.keys(records).length;
        if ( n > 0 ) {
            console.log("Remaining keys:", Object.keys(records));
            throw(n + " number of failures!");
        }
    });



[passing](# "js")

    function (data) {
        delete records[data];
        console.log("passed: " + data);
    }

[failing](# "js")

    function (data) {
        console.log("FAILED: " + data.key);
        console.log(data.result);
    }    

[run sync tests](# "js")

    function (tests) {
        var key, result; 


        for (key in tests ) {
            result = tests[key]();
            if (result === true) {
                tester.emit("passed", key);
            } else {
                tester.emit("failed", {key:key, result:result});
            }
        }
    }
