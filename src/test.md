# Test files

This is a set of tests for this library to pass. 


## two on and some emits

This tests the basic emit--on functions

[name]()

     two on and some emits

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


## simple once test

This tests that the once removes itself. We do a case with no number and one with 2 attached. 

[name]()

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

## checking labels and onces

This test has some onces with and without labels and checking that the onces
work. It also does a once with two handlers to make sure that works correctly. 

[name]()

    checking labels and onces


[expected]() 


     {\"for first\":[\"first ready\",1,1],\"sec sec\":[\"second ready\",1,1]} 
     first fires
     second fires
     second second fires 
     {} 
     second fires
     {} 

[code]()

    var l = function (label, f) {
        f._label = label; 
        return f;
    };

    var ao = function () {actual.push(JSON.stringify(emitter._onces));};

    emitter.once("first ready", l("for first", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    }));


    emitter.once("second ready", function () {
        actual.push("second fires");
    }, 2);

    emitter.once("second ready", l("sec sec", function () {
        actual.push("second second fires");
    }));


    ao();
    emitter.emit("first ready");
    ao();
    emitter.emit("first ready");    
    emitter.emit("second ready");
    ao();
    emitter.emit("done");




## turning off a handler


This tests that we can remove handlers.

[name]()

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


## when waiting for 2 events

Testing the when capabilities.

[name]()

    when waiting for 2 events

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



## testing when ordering

Testing the when capabilities for ordering and event strings.

[name]()

    testing when ordering
    
[expected]()

     first ready ;; boo ;; first ready:button
     second ready ;; hoo
     second ready ;; 
     first ready ;; next first
     fourth ready:cool ;; yet
     third ready ;; not ;; third ready:not 

[code]()

    emitter.initialOrdering = true;

    emitter.when(["first ready", ["second ready", 2]], "both ready");

    emitter.when("first ready", "both ready");

    emitter.when(["third ready", "fourth ready:cool"], "more ready", 
        "momentary", false, false, false ); // testing override

    var h = function (data) {
        data.forEach(function (el) {
            actual.push(el.join(" ;; ").trim());
        });
    };

    emitter.on("both ready", h);

    emitter.on("more ready", h);

    emitter.emit("second ready", "hoo");
    emitter.emit("first ready:button", "boo");
    emitter.emit("second ready");
    emitter.emit("first ready", "next first");    
    emitter.emit("second ready");
    emitter.emit("second ready", "never seen");

    emitter.emit("fourth ready:cool", "yet");
    emitter.emit("third ready:not", "not");

    emitter.emit("done");



## flat when

Testing flat when capabilities.

[name]()

    flat when

[expected]()
    
    A
    C
    E


[code]()

    emitter.flatWhen(["first ready", "second ready"], "both ready");

    emitter.flatWhen("third ready", "single ready");


    emitter.on("both ready", function (data) {
        actual.push(data[0]);
        actual.push(data[1]);
    });

    emitter.on("single ready", function (data) {
        actual.push(data);
    });

    emitter.emit("first ready", "A");

    emitter.emit("first ready", "B");
    emitter.emit("second ready", "C");
    emitter.emit("first ready", "D");    
    emitter.emit("third ready", "E");

    emitter.emit("done");



## silent when

Testing flat when capabilities.

[name]()

    silent when

[expected]()
    
    C  

[code]()

    var tracker = emitter.flatWhen(["first ready", "second ready", "third ready"], 
        "both ready").silence();

    tracker.silence("first ready");

    emitter.on("both ready", function (data) {
        actual.push(data);
    });


    emitter.emit("first ready", "A");

    emitter.emit("first ready", "B");
    emitter.emit("second ready", "C");
    emitter.emit("first ready", "D");    
    emitter.emit("third ready", "E");

    emitter.emit("done");

## Flat array when

Testing flat array when

[name]()

    flat array when

[expected]()

    AB
    EF
    CD

[code]()

    emitter.flatArrWhen("single", "single ready");
    emitter.on("single ready", function(data) {
        actual.push(data[0]);
    });
    emitter.emit("single", "AB");
   
    emitter.flatArrWhen(["two", "three"], "two ready");
    emitter.on("two ready", function (data) {
        data.forEach(function (el) {
            actual.push(el);
        });
    });
    emitter.emit("three", "EF");
    emitter.emit("two", "CD");
    

    emitter.emit("done");


## checking action naming

Testing actions.

[name]() 

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

Want to emitting data and handler context

[name]()

    handler with context

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

## Handler with two handles

Let's have a function that acts and then an event that emits saying it acted. 

[name]()

    handler with two handles

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

## checking handlers and events

This is testing .events(). 

[name]()

    checking handlers and events

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


## Canceling

Can we remove handlers or stop events? 

[name]()

    canceling

[expected]()

    emit this
    emit that 1
    emit that 2


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
            actual.push("not seen because the handler array is stopped");
    }]);

    emitter.on("stopping test", [function () {
            actual.push("never seen as it gets canceled beforehand");
    }]);


    emitter.emit("bubbling stopping");
    emitter.emit("stopping test");

    emitter.emit("done");

## Error checking

Let's throw an error.

[name]()

    error checking

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

## Flow testing

Does `.later` work? 

[name]()

    flow testing

[expected]()

    A
    J
    I
    K
    G
    check
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

    emitter.scope("G", "check");

    emitter.on("term", function (data, evObj) {

        var base = evObj.pieces[0], 
            scope = evObj.scopes[base];

        actual.push(base);

        if ( typeof scope !== "undefined") {
            actual.push(scope);
        }
    
    });

    emitter.when([["term",8]], "done");

    emitter.emit("A");
    emitter.emit("B");


## when with later

Does `.later` work for `.when`? 

[name]()

    when with later

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

## Handler info

This tests the summarize of handlers. 

[name]()

    handler info

[expected]()

    h:fred bob[a:hi, `jack`, h: [a:dude, ``]]

[code]()

    var h = emitter.on("cool", ["hi", function jack () {}, emitter.makeHandler(["dude", function(){}])]);

    h._label = "fred";
    h.value._label = "bob";

    actual.push(h.summarize());

    emitter.emit("done");

## Tracker testing

[name]()

    tracker testing

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
    t.idempotent = true;

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


## stop 

We want to test all the possibilities of the stop method: 

* no args, clearing all events.
* true, clears current event.
* string, partial match clears event. 
* reg, match clears event
* array, exact matches clears event
* function, true return value clears event
* neg as second argument negates all filter types

Need a break between list and code

    test("stop", function (t) {
        t.plan(11);
        var noop = function () {};
        var run = function (stopper) {
            var emitter = new EventWhen();
            emitter.on("start", function () {
                emitter.emit("one:bob").
                    emit("two:bob").
                    emit("three:jane").
                    emit("four").
                    stop.apply(emitter, stopper[0]);
                var evs = emitter._queue.map(function(el) {
                    return el.ev;
                });
                t.deepEquals(evs, stopper[1], stopper[2]);
            });
            emitter.on("one:bob", noop);
            emitter.on("two:bob", [noop, noop]);
            emitter.on("three:jane", noop);
            emitter.on("four", noop);
            emitter.emit("start");
        }; 
        
        var scopes = function (ev, el) {
            if (el.pieces.length >1) {
                return true;
            } else {
                return false;
            }
        };

        var stops = [
        [ [], [], "no args" ],
        [ [true], ["one:bob", "two:bob", "three:jane", "four"], "true"],
        [ ["bob"],  ["start", "three:jane", "four"], "str bob" ],
        [ ["bob", true], ["one:bob", "two:bob"], "neg str bob" ],
        [ [/^t/], ["start", "one:bob",  "four"], "reg start t"],
        [ [/^t/, true], ["two:bob", "three:jane"], "neg reg start t"],
        [ [["two:bob", "three:jane"]], ["start", "one:bob",  "four"], "arr"],
        [ [["two:bob", "three:jane"], true], ["two:bob", "three:jane"], 
        "not arr"],
        [ [scopes], ["start", "four"], "function"],
        [ [scopes, true], ["one:bob", "two:bob", "three:jane"], 
        "neg function"],
        [ [{ar:1}], [],
        "not known"] 
        ];

        stops.forEach(run);
    });


## scope

This tests the scope command in all its incarnations. 

    test("scope", function (t) {
        t.plan(14);
               
        var emitter = new EventWhen();

        t.equals(emitter.scope().length, 0, "empty scope");
        t.equals(Object.keys(emitter.scopes()).length, 0, "empty scopes");
        
        emitter.scope("one:bob", "neat").
            scope("two:bob", {}).
            scope("three:jane", "cool").
            scope("four", {a:"this"});

        t.equals(emitter.scope().length, 4, "scope loaded");
        
        t.deepEquals(emitter.scopes("bob"), {"one:bob" : "neat",
        "two:bob": {}}, "substring");
        t.deepEquals(emitter.scopes("bob", true), {"three:jane" : "cool",
        "four": {a: "this"}}, "substring neg");

        t.deepEquals(emitter.scopes(["one:bob", "bob"]), 
        {"one:bob" : "neat"}, "array of matches");
        t.deepEquals(emitter.scopes(["one:bob", "bob"], true),
        {"two:bob": {}, "three:jane" : "cool",
        "four": {a: "this"}}, "array neg");

        t.deepEquals(emitter.scopes(/^o/), 
        {"one:bob" : "neat"}, "reg");
        t.deepEquals(emitter.scopes(/^o/, true),
        {"two:bob": {}, "three:jane" : "cool",
        "four": {a: "this"}}, "reg neg");
        
        t.deepEquals(emitter.scopes(function(el) { 
            return el === "one:bob";
        }), 
        {"one:bob" : "neat"}, "fun");
        t.deepEquals(emitter.scopes(function(el) { 
            return el === "one:bob";
        }, true),
        {"two:bob": {}, "three:jane" : "cool",
        "four": {a: "this"}}, "fun neg"); 
      
        emitter.scope("two:bob", null);

        emitter.scope("one:bob", "diff");

        t.equals(emitter.scope().length, 3, "removal");
        t.equals(emitter.scope("one:bob"), "diff", "different");
        t.equals(typeof emitter.scope("two:bob"), "undefined", "gone");

    });

## monitor

We will test the monitor function. 

    test("monitor", function (t) {
        var emitter = new EventWhen(), 
            removed = false, 
            bob, nbob;

        t.plan(7);

        bob = emitter.monitor(/bob/, function (ev, data) {
            t.equals(ev, "catch:bob", "bob caught");
            t.equals(data, "neat", "bob data");
            return "stop";
        });

        nbob = emitter.monitor([/bob/, true], function (ev) {
            t.equals(ev, "catch:jane", "jane caught");
        });

        emitter.on("catch:bob", function () {
            if (removed) {
                t.pass("removal okay");
            } else {
                t.fail("should have been stopped");
            }
        });

        emitter.emit("catch:bob", "neat");

        emitter.emit("catch:jane");

        t.equals(emitter.monitor().length, 2);
        emitter.monitor(bob);
        removed = true;
        t.equals(emitter.monitor().length, 1);

        emitter.emit("catch:bob", "neat");
        
        emitter.monitor(nbob);

        t.equals(emitter.emit, emitter._emit, "orig emit");

    });

## Action

Here we have tests for loading and analyzing actions (not them actually
acting).

    test("action", function(t) {

        t.plan(9);

        var emitter = new EventWhen();
        t.equals(emitter.action().length, 0, "empty action");
        
        var a = emitter.action("first", "h");
        t.deepEquals(emitter.action().length, 1, "action added");
        t.deepEquals(emitter.actions(), {"first":a}, "actions retrieved");
        
        var b = emitter.action("second", "j");
        var c = emitter.action("first:second", "k");
        t.deepEquals(emitter.actions("first"), 
            {"first":a, "first:second":c}, 
            "actions string");
        t.deepEquals(emitter.actions("first", true), {"second": b}, 
            "actions string neg");
        
        t.deepEquals(emitter.action("first"), a , 
            "action retrieved");

        t.deepEquals(Object.keys(emitter.actions()).length,
            3, "action listing");
        emitter.action("first", null);
        t.deepEquals(Object.keys(emitter.actions()).length, 
            2, "action removal");
        t.equals(typeof emitter.action("first"), "undefined", 
            "undefined action");
        

    });

## events handlers listing

This will test the listing of events and handlers.

    test("events handlers listing", function (t) {

        t.plan(14);

        var emitter = new EventWhen();

        t.equals(emitter.events().length, 0, "no events");
        var a = emitter.on("first:bob", "act 1");
        t.equals(emitter.events().length, 1, "added event");
        t.deepEquals(emitter.handlers(), {"first:bob" : [a]});

        var b = emitter.on("bob", "act 2");
        var c = emitter.on("second:jane", "act 3");
        var d = emitter.on("first:bob", "act 4");
        var e = emitter.on("first:bob", "act 5");

        t.equals(emitter.events().length, 3, "three events");
        t.deepEquals(emitter.handlers(""), {
            "first:bob": [a, d, e],
            "bob" : [b],
            "second:jane" : [c]
        });
        t.deepEquals(emitter.events("bob").sort(), ["first:bob",
            "bob"].sort(), "bob filter");
        t.deepEquals(emitter.events(["bob"]), 
            ["bob"], "exactly bob");

        t.deepEquals(emitter.events("bob", true),
        ["second:jane"], "not bob");
        t.deepEquals(emitter.events(["bob"], true).sort(), 
            ["first:bob", "second:jane"].sort(), "not exactly bob");

        t.deepEquals(emitter.handlers(["bob", true]), {
            "second:jane" : [c]}, "not bob handler");
        t.deepEquals(emitter.handlers([["bob"], true]), {
            "first:bob":[a, d, e],
            "second:jane" : [c]
            }, "not exactly bob");

        t.deepEquals(emitter.handlers(["bob", "jane"], true), {
            "bob":[b],
            "jane" : null
            }, "handlers empty arg");
        t.deepEquals(emitter.handlers(["bob", "jane"]), {
            "bob":[b]
            }, "handlers no empty arg");

        emitter.off("first:bob", d); 
        emitter.off("bob");

        t.deepEquals(emitter.handlers("bob"), {
            "first:bob" : [a, e]
        }, "handler removals");

    });

## decycle

This tests the utilty function decycle directly

    test("decycle", function (t) {
        
        t.plan(1);

        var emitter = new EventWhen();

        var a = [{b:1}];
        a[1] = a;
        t.equals(JSON.stringify(emitter.decycle(a)),
        '[{"b":1},{"$ref":"$"}]', "Simple cycle");
    });

## log testing

This will test out the various log stuff. 

    test("log testing", function (t) {
        
        t.plan(1);

        var emitter = new EventWhen();

        var log = emitter.makeLog();

        emitter.when(["dudette", "gone"], "gogo");

        var f = function () {};
        f._label = "awesome";

        emitter.once("gone", f); 

        emitter.action("dude", f);

        emitter.on("dudette", "dude");

        emitter.on("jack", "dude");

        emitter.emit("jack:allan");

        emitter.emit("first", "got data");

        emitter.emit("dudette", "JJ");

        emitter.emit("gone", "LL");


        //console.log(log.logs());
   
        t.deepEquals(log.logs(),
        [ 'WHEN: "gogo" AFTER: ["dudette","gone"]',
          'ATTACH "awesome" TO "gone" FOR 1',
          'NEW ACTION "dude" FUN "awesome"',
          'ATTACH "dude" TO "dudette"',
          'ATTACH "dude" TO "jack"',
          '1. EMITTING "jack:allan"',
          '1) ACTING "dude" EVENT \'jack\':allan',
          '1) EXECUTING awesome EVENT "jack"',
          '2. EMITTING "first" DATA "got data"',
          '3. EMITTING "dudette" DATA "JJ"',
          'REMOVING HANDLER ["h:(when)gogo ``] FROM "dudette"',
          '3) ACTING "dude" EVENT \'dudette\'',
          '3) EXECUTING awesome EVENT "dudette"',
          '4. EMITTING "gone" DATA "LL"',
          'REMOVING HANDLER ["h:(when)gogo ``] FROM "gone"',
          '5. EMITTING "gogo" DATA [["dudette","JJ"],["gone","LL"]]',
          '4) EXECUTING g EVENT "gone"', 
          '4) EXECUTING awesome EVENT "gone"',
          '4) EXECUTING h EVENT "gone"',
          'REMOVING HANDLER ["h:(once)awesome [`g`, `f`, `h`]"] FROM "gone"' ],
        "emit event");
    });

## summarize

This is to test the handler method of summarize. 

    test("summarize", function (t) {

        t.plan(1);
        
        var emitter = new EventWhen();

        var h1 = emitter.makeHandler("act", {n:1});

        var h2 = emitter.makeHandler(h1);

        h2._label = "hi";

        var named = function bob () {"what";};

        var h3 = emitter.makeHandler([function () {"neat";}, h2, named]);

        t.equals(h3.summarize(), "h: [``, h:hi a:act, `bob`]", 
            " level handler");

    });

## when 

This is code that should break.

    test("when counting", function (t) {
        
        t.plan(6);

        var emitter = new EventWhen();
        
        var n = 100;
        var c = 0;

        emitter.once("go", function () {
            c += 1;
            emitter.emit("go");
            if ( c % 20 === 0) {
                t.pass("count is a multiple of 20");
            }
        }, n+5);

        emitter.when(["go", n], "done", "now");

        emitter.on("done", function () {
            t.equals(c, 100, "when fired correctly");
        });

        emitter.emit("go");
    });


## whens

This is to check that the .whens mechanism works. 

    test("whens checking", function (t) {

        t.plan(1);

        var emitter = new EventWhen();

        emitter.once("great", function (data) {
            if (data[0][0] === "three") {
                t.pass("three events done");
            } else {
                t.fail(data);
            }
        });
        
        emitter.when(["one", "two"], "great");
        emitter.emit("one");

        emitter.when("three", "great");
        emitter.emit("two");

        emitter.emit("three", "some data");
    });

## cache

This is to check that the .cache mechanism works. 

    test("cache checking", function (t) {

        t.plan(1);

        var emitter = new EventWhen();

        var count = 0;
        var log = [];

        emitter.on("readfile", function (data, evObj) {
            var loc = count += 1;
            process.nextTick(function () {
                emitter.emit("file read:" + evObj.pieces[0], 
                    evObj.pieces[0] + loc + ( (data) ? " " + data : "") );
            });
        });
    
        emitter.on("log", function (data) {
            log.push(data);
            emitter.emit("seen");
        });

        emitter.when(["seen", 4], "done", "now");

        emitter.on("done", function () {
            t.equals(log.join("\n"), 
            "second jack2\njack1\nthird jack1\njill2 neat", "cache works");
        });


        emitter.cache("readfile:jack", "file read:jack", "log"); 

    
        emitter.cache("readfile:jack", "file read:jack", function () {
            log.push("second jack"+count);
            emitter.emit("seen");
        });
        

        emitter.once("file read:jack", function () {
            emitter.cache("readfile:jack", 
                "file read:jack",  function (data) {
                    return "third " + data;
                }, "log");
        });

        emitter.cache(["readfile:jill", "neat", "now"], "file read:jill", "log" );
        


    });

## once twice

This is to check that we can't call a once handler more than once if it is to
only be called once. 

In the original, this would fail. By placing an emit of "first" before the
once handler called, the handlers involving the once get loaded onto the
queue before being removed. The solution was to allow for handler
termination (return true) and thus the once counter handler returns true if
it shouldn't fire. This also takes care of passing in a 0 for once -- now it
will not fire.  

    test("once twice", function (t) {
    
        t.plan(1);

        var emitter = new EventWhen();
        var n = 0;

        emitter.on("first", function () {
            if ( n < 2) {
                emitter.emit("first");
                n += 1;
            }
        });

        emitter.once("first", function a () {
            t.pass("`a` called");
        });

        emitter.once("first", function b () {
            t.fail("`b` called");
        }, 0);

        emitter.emit("first");

    });


## Empty queue

This creates a custom empty queue function and tests whether it gets fired
correctly. 

    test("empty queue", function (t) {
    
        t.plan(1);

        var emitter = new EventWhen();
        emitter.queueEmpty = function () {
            emitter.emit("go again");
        };

        emitter.once("go again", function () {
            emitter.queueEmpty = function () {
                t.pass('seen');
            };
            emitter.emit("wow");
        });

        emitter.on("first", function () {
            emitter.emit("two");
        });

        emitter.emit("first");

    });



## Test Template

This is the test template

    test('\_":name"', function (s) {
        s.plan(1);

        var emitter = new EventWhen();

        var expected = \_":expected| arrayify",
            actual = [];

        _"done"

        \_":code"

    })
    
    
## Done

This is a snippet that should be placed at the end of each async function. 

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });



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

 [arrayify](#arrayify "define: sync")


## Testrunner


    /*global require, process*/
    var EventWhen = require('./index.js'),
        test = require('tape');

    _"test template | compile two on and some emits";

    _"test template | compile simple once test";
    
    _"test template | compile checking labels and onces";

    _"test template | compile turning off a handler";

    _"test template | compile when waiting for 2 events";
    
    _"test template | compile flat when";

    _"test template | compile silent when";
    
    _"test template | compile flat array when";

    
    _"test template | compile testing when ordering";

    _"test template | compile checking action naming";

    _"test template | compile checking handlers and events";

    _"test template | compile handler with context";

    _"test template | compile handler with two handles";

    _"test template | compile canceling";

    _"test template | compile error checking";

    _"test template | compile flow testing";

    _"test template | compile when with later";

    _"test template | compile handler info";    

    _"test template | compile tracker testing";    

    _"stop"

    _"scope"

    _"monitor"
    
    _"action"

    _"events handlers listing"

    _"decycle"

    _"log testing"

    _"summarize"

    _"when"

    _"whens"
    
    _"once twice"
    
    _"empty queue"

    _"cache"

