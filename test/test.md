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

[key]()

    turning off a handler

[expected]()

    first fires
    second fires
    second fires
    

[code]()    

    var h = emitter.on("first ready", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });

    emitter.on("first ready", function () {
        actual.push("second fires");
    });

    emitter.emit("first ready");
    emitter.off("first ready", h);
    emitter.emit("first ready");    
    emitter.emit("second ready");

    emitter.emit("done");

## when

Testing the when capabilities.


[key]()
    
    .when waiting for 2 events

[expected]()
    
    when fired


[code]()

    emitter.when(["first ready", "second ready"], "both ready");


    emitter.on("both ready", function () {
        actual.push("when fired");
    });

    emitter.emit("first ready");
    emitter.emit("first ready");
    emitter.emit("second ready");
    emitter.emit("first ready");    
    emitter.emit("second ready");

    emitter.emit("done");

## action

Testing actions.

[key]()

    checking action naming


[expected]()

    first fired

[code]()

    emitter.action("fire the first one", function () {
        actual.push("first fired");
    });

    emitter.on("first ready", "fire the first one");

    emitter.emit("first ready");

    emitter.emit("done");


## Handler with context

Want to pass in some data and some myth

[key]()

    Handler with context

[expected]()

    jt:says hi!

[code]()


    emitter.on("first ready", function (data) {
        var self = this;
        actual.push(self.myth.handler.name + 
            ":" + self.data.handler + 
            " " + data + self.myth.emit.punctuation);
    }, "says", {name:"jt"});

    emitter.emit("first ready", "hi", {punctuation: "!"});

    emitter.emit("done");

## Handler with two handles

Let's have a function that acts and then an event that emits saying it acted. 


[key]()

    Handler with two handles

[expected]()

    one:golden
    two:golden
    three:golden

[code]()

    emitter.on("first ready", [function (data) {
        actual.push("one:"+data);
    }, "an action fired"]);

    emitter.on("first ready", "great");

    emitter.action("an action fired", function (data) {
        actual.push("two:"+data);
    });

    emitter.action("great", function (data) {
        actual.push("three:"+data);
    });



    emitter.emit("first ready", "golden");

    emitter.emit("done");

## Listing handlers and events

This is testing .events(). 

[key]()

    checking handlers and events

[expected]()

    first;fire
    second;water
    first;water
    first;second;fire;water

[code]()

    emitter.off("done");

    emitter.on("first",  "works");

    emitter.on("second", "yadda");

    emitter.on("fire",  "brim");

    emitter.on("water",  "works");    

    actual.push(emitter.events("fir").join(';'));

    actual.push(emitter.events("fir", true).join(';'));
    
    actual.push(emitter.events(function (ev) {
        var h = emitter._handlers[ev];
        if ( h.contains("works", h ) ){
            return true;
        } else {
            return false;
        }
    }).join(';'));
    
    actual.push(emitter.events().join(';'));

    _"async emitting"

    emitter.emit("done");


## Canceling

Can we remove handlers or stop events? 

[key]()

    canceling

[expected]()

    emit this
    emit that 1
    emit that 2
    seen because the handler array is not stopped


[code]()

    emitter.action("stop emission", function () {
            actual.push("emit this");
            this.stop = true;
    });

    emitter.action("not seen in array",function () {
            actual.push("not actually ever seen");
    }); 

    emitter.on("bubbling stopping", ["stop emission", "not seen in array" ]);

    emitter.on("bubbling stopping", function () {
            actual.push("not seen either");
    });


    emitter.on("stopping test", [function () {
            actual.push("emit that 1");
    }]);


    emitter.on("stopping test", [function () {
            actual.push("emit that 2");
            this.emitter.stop(true);
        }, function () {
            actual.push("seen because the handler array is not stopped");
    }]);

    emitter.on("stopping test", [function () {
            actual.push("never seen as it gets canceled beforehand");
    }]);


    emitter.emit("bubbling stopping");
    emitter.emit("stopping test");

    emitter.emit("done");

## Error checking

Let's throw an error.

[key]()

    error checking

[expected]()

    Error: Checking!
    Checking!\nerror event\nawesome

[code]()        


    // default error

    var h = emitter.on("error event", function () {
        throw Error("Checking!");
    })

    h.name = "awesome";


    try {
        emitter.emit("error event");
    } catch (e) {
        actual.push(e.message);
    }

    //error overide

    emitter.error = function (e, value, data, passin) {
        actual.push([e.message, passin.event, passin.handler.name].join("\n"));
    };

    emitter.emit("error event");

    emitter.emit("done");

## Flow testing

Does `.later` work? 


[key]()

    flow testing

[expected]()

    A
    J
    I
    K
    G
    H
    B
    C
    F
    E
    D

[code]()


    emitter.on("A", function () {
        actual.push("A");
        emitter.later("C");
        emitter.now("term:I");
        emitter.momentary("term:G");
        emitter.momentary("term:H");
        emitter.now("term:J");
    });

    emitter.on("A", function () {
        emitter.now("term:K");
    });

    emitter.on("C", function () {
        actual.push("C");
        emitter.later("term:D");
        emitter.soon("term:F");
    });
    emitter.on("B", function () {
        actual.push("B");
        emitter.later("term:E");
    });

    emitter.on("term", function () {
        var passin = this;
        actual.push(passin.evObj.pieces[1]);
    });

    emitter.when([["term",8]], "done");

    emitter.emit("A");
    emitter.emit("B");


## when async

Does `.later` work for `.when`? 


[key]()

    .when with later

[expected]()

    A
    B
    E
    A
    A
    B
    E
    D
    B
    D
    C
    C
    A
    E
    D
    C

[code]()

    emitter.on("A", function () {
        actual.push("A");
    });
    emitter.on("B", function () {
        actual.push("B");
    });

    emitter.on("C", function () {
        actual.push("C");
    });

    emitter.on("D", function () {
        actual.push("D");
    });

    emitter.on("E", function () {
        actual.push("E");
    });

    emitter.when(["A", "B"], "C", "later", true);

    emitter.when(["A", "B"], "D", "soon", true);

    emitter.when(["A", "B"], "E", "momentary", true);

    var temp = emitter.when([["A", 4], ["B", 3], ["C", 3], ["D", 3], ["E", 3]], "done");

    emitter.emit("A");
    emitter.emit("B");
    emitter.emit("A");
    emitter.emit("A");
    emitter.emit("B");
    emitter.later("A");
    emitter.emit("B");



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

//        console.log("done with", key);

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
        "basic again" : _"basic again*test template",
        "simple once test" : _"once*test template",
        "turning off a handler" : _"off*test template",
        ".when waiting for 2 events" : _"when*test template",
        "checking action naming" : _"action*test template",
        "checking handlers and events" : _"Listing handlers and events*test template",
        "handler with context" : _"handler with context*test template",
        "handler with two handles" : _"Handler with two handles*test template",
        "canceling" : _"canceling*test template",
        "error checking" : _"error checking*test template",
        "flow testing" : _"flow testing*test template",
        ".when with later" : _"when async*test template"
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

    function (key) {
        key = key.toLowerCase();
        delete records[key];
        console.log("passed: " + key);
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
