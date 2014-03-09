# Event-when tests

This is a set of tests for this library to pass. 

It produces just a single test file:  [testrunner.js](#testrunner "save: |jshint")


## Tests

These are the tests

### two on and some emits

This tests the basic emit--on functions


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


### simple once test

This tests that the once removes itself. We do a case with no number and one with 2 attached. 


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

### turning off a handler


This tests that we can remove handlers.


[expected]()

    first fires
    second fires
    first fires
    

[code]()    

    var h = emitter.on("first", function () {
        emitter.emit("second");
    });

    emitter.on("first", function () {
        actual.push("first fires");
    });


    emitter.on("second", function () {
        actual.push("second fires");
    });

    emitter.emit("first");
    emitter.off("first", h);
    emitter.emit("first");    

    emitter.emit("done");

### when waiting for 2 events

Testing the when capabilities.


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

### checking action naming

Testing actions.


[expected]()

    first fired

[code]()

    emitter.action("fire the first one", function () {
        actual.push("first fired");
    });

    emitter.on("first ready", "fire the first one");

    emitter.emit("first ready");

    emitter.emit("done");


### Handler with context

Want to emitting data and handler context


[expected]()

    jt: hi!

[code]()


    emitter.on("first ready", function (data) {
        var self = this;
        actual.push(self.name + 
            ": " + data[0] + data[1].punctuation);
    }, {name:"jt"});

    emitter.emit("first ready", ["hi", {punctuation: "!"}]);

    emitter.emit("done");

### Handler with two handles

Let's have a function that acts and then an event that emits saying it acted. 

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

### checking handlers and events

This is testing .events(). 


[expected]()

    first;fire
    done;second;water
    first;water
    done;first;second;fire;water

[code]()

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

    emitter.emit("done");


### Canceling

Can we remove handlers or stop events? 


[expected]()

    emit this
    emit that 1
    emit that 2
    seen because the handler array is not stopped


[code]()

    emitter.action("stop emission", function (data, evObj) {
            actual.push("emit this");
            evObj.stop = true;
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


    emitter.on("stopping test", [function (data, evObj) {
            actual.push("emit that 2");
            evObj.emitter.stop(true);
        }, function () {
            actual.push("seen because the handler array is not stopped");
    }]);

    emitter.on("stopping test", [function () {
            actual.push("never seen as it gets canceled beforehand");
    }]);


    emitter.emit("bubbling stopping");
    emitter.emit("stopping test");

    emitter.emit("done");

### Error checking

Let's throw an error.


[expected]()

    Error: Checking!
    Checking!\nerror event\nawesome

[code]()        


    // default error

    var h = emitter.on("error event", function () {
        throw Error("Checking!");
    });

    h.name = "awesome";


    try {
        emitter.emit("error event");
    } catch (e) {
        actual.push(e.message);
    }

    //error overide

    emitter.error = function (e, value, data, evObj) {
        var cur = evObj.cur;
        actual.push([e.message, cur[0], cur[1].name].join("\n"));
    };

    emitter.emit("error event");

    emitter.emit("done");

### Flow testing

Does `.later` work? 

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

    emitter.on("term", function (data, evObj) {
        actual.push(evObj.pieces[1]);
    });

    emitter.when([["term",8]], "done");

    emitter.emit("A");
    emitter.emit("B");


### when with later

Does `.later` work for `.when`? 

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

    emitter.when(["A", "B"], "D", true, "soon");

    emitter.when(["A", "B"], "E", "momentary", true);

    emitter.when([["A", 4], ["B", 3], ["C", 3], ["D", 3], ["E", 3]], "done");

    emitter.emit("A");
    emitter.emit("B");
    emitter.emit("A");
    emitter.emit("A");
    emitter.emit("B");
    emitter.later("A");
    emitter.emit("B");

### Handler info

This tests the summarize of handlers. 

[expected]()

    h: fred arr: bob [a:hi, f:, h:  arr:  [a:dude, f:]]

[code]()

    var h = emitter.on("cool", ["hi", function() {}, emitter.makeHandler(["dude", function(){}])]);

    h.name = "fred";
    h.value[1].name = "jack";
    h.value.name = "bob";

    actual.push(h.summarize());

    emitter.emit("done");

### Tracker testing

[expected]()

    some:5
    some:2,neat:1
    some:1
    great emitted
    great emitted
    neat:1
    great emitted
    neat:1
    great emitted
    ---
    some:5
    great emitted
    ---

[code]()

    emitter.on("great", function () {
        actual.push("great emitted");
    });

    var t = emitter.when([["some", 5]], "great");

    var report = function () {
        var keys = Object.keys(t.events);
        var obj = keys.map(function (el) {
            return el + ":" + t.events[el];
        });
        actual.push( obj.join(",") || "---" );
    };

    report();
    t.add("neat");
    t.go();
    t.remove([["some", 3]]);
    report();
    emitter.emit("neat");
    emitter.emit("some");
    report();
    emitter.emit("some");
    t.go();
    t.add("neat");
    report();
    t.go();
    emitter.emit("neat");
    t.add("neat");
    report();
    t.remove("neat");
    report();
    t.reinitialize();
    report();
    t.cancel();

    report();

    emitter.emit("done");

# Testrunner

    /*global require*/
    var EventWhen = require('../index.js'),
        test = require('tape');

    _"two on and some emits*test template";

    _"simple once test*test template";

    _"turning off a handler*test template";

    _"when waiting for 2 events*test template";

    _"checking action naming*test template";

    _"checking handlers and events*test template";

    _"handler with context*test template";

    _"handler with two handles*test template";

    _"canceling*test template";

    _"error checking*test template";

    _"flow testing*test template";

    _"when with later*test template";

    _"handler info*test template";    

    _"tracker testing*test template";    

## Test Template

This is the test template

    test('_"*:expected|heading"', function (s) {
        s.plan(1);

        var emitter = new EventWhen();

        var expected = _"*:expected| arrayify",
            actual = [];

        _"done"

        _"*:code"

    })

## Done

This is a snippet that should be placed at the end of each async function. 

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });


# Commands

These are custom lit pro commands.

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


## Heading

    function () {
        return this.hblock.heading.split("*")[0]; 
    }

 [heading](#heading "define: command | | now")


