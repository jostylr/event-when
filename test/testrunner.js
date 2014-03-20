/*global require*/
var EventWhen = require('../index.js'),
    test = require('tape');

test('two on and some emits', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "first fires",
        "second fires"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

    emitter.on("first ready", function () {
        actual.push("first fires");
        emitter.emit("second ready");
    });
    
    emitter.on("second ready", function () {
        actual.push("second fires");
        emitter.emit("done");
    });
    
    emitter.emit("first ready");

});

test('simple once test', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "first fires",
        "second fires",
        "second fires"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('turning off a handler', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "first fires",
        "second fires",
        "second fires"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('when waiting for 2 events', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "when fired"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('checking action naming', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "first fired"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

    emitter.action("fire the first one", function () {
        actual.push("first fired");
    });
    
    emitter.on("first ready", "fire the first one");
    
    emitter.emit("first ready");
    
    emitter.emit("done");

});

test('checking handlers and events', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "first;fire",
        "done;second;water",
        "first;water",
        "done;first;second;fire;water"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('handler with context', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "jt: hi!"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

    emitter.on("first ready", function (data) {
        var self = this;
        actual.push(self.name + 
            ": " + data[0] + data[1].punctuation);
    }, {name:"jt"});
    
    emitter.emit("first ready", ["hi", {punctuation: "!"}]);
    
    emitter.emit("done");

});

test('handler with two handles', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "one:golden",
        "two:golden",
        "three:golden"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('canceling', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "emit this",
        "emit that 1",
        "emit that 2"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('error checking', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "Error: Checking!",
        "Checking!\nerror event\nawesome"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('flow testing', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "A",
        "J",
        "I",
        "K",
        "G",
        "H",
        "B",
        "C",
        "F",
        "E",
        "D"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('when with later', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "A",
        "B",
        "E",
        "A",
        "A",
        "B",
        "E",
        "D",
        "B",
        "D",
        "C",
        "C",
        "A",
        "E",
        "D",
        "C"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});

test('handler info', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "h: fred arr: bob [a:hi, f:, h:  arr:  [a:dude, f:]]"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

    var h = emitter.on("cool", ["hi", function() {}, emitter.makeHandler(["dude", function(){}])]);
    
    h.name = "fred";
    h.value[1].name = "jack";
    h.value.name = "bob";
    
    actual.push(h.summarize());
    
    emitter.emit("done");

});    

test('tracker testing', function (s) {
    s.plan(1);

    var emitter = new EventWhen();

    var expected = [
        "some:5",
        "some:2,neat:1",
        "some:1",
        "great emitted",
        "great emitted",
        "neat:1",
        "great emitted",
        "neat:1",
        "great emitted",
        "---",
        "some:5",
        "great emitted",
        "---"
        ],
        actual = [];

    emitter.on("done", function () {
        s.deepEqual(actual, expected);
    });

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

});    

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