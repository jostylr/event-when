# Emit When Examples

Here we will have a few different examples of using emit when. 

## [simple.js](#simple.js "save: |jshint")

Let's just do a basic simple example

    /*global require, console*/
    var EventWhen = require('../index.js'),
        emitter = new EventWhen(), 
        f;

    emitter.makeLog();


    f = emitter.on("test 1 on", function t1s () {
        emitter.emit("test 1 finishes");
    });

    emitter.on("test 1 finishes", function t1f () {
        emitter.off("test 1 on", f);
        emitter.emit("test 1 on");
    });


    emitter.emit("test 1 on");

    console.log(emitter.log.logs());

    console.log("just emits now:" ); 
    console.log(emitter.log.logs("emitted"));


## [when.js](#when.js "save:| jshint")

Now let's involve some when action.

    /*global require, console, process*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    emitter.on("alice", function a () {
    });

    emitter.on("bob", function b () {
    });

    emitter.once("alice rocks", function ar () {
    });

    emitter.on("both fired", function (data) {
        console.log("data events", data);
    });

    emitter.when(["alice", "bob"], 
        "both fired", true );
    
    emitter.when(["alice", "bob"], 
        "first time for alice, bob");
    
    emitter.when([["alice",2]], "alice fired twice");
    

    emitter.emit("alice", "a1");
    emitter.emit("alice", "a2");
    emitter.emit("bob", {alice: "rocks"});

    emitter.emit("alice", "a3");
    emitter.emit("bob", {alice: "awesome"});

    console.log(emitter.log.logs(["emitted", "Executing"]));





## [once.js](#once.js "save: | jshint")

Testing the once method

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    emitter.once("test 1", function t1 () {
        emitter.emit("test 2");
    });


    // it will not fire!
    emitter.once("test 2", function t2a () {
    }, 0);

    emitter.once("test 2", function t2b () {
    }, 2);

    emitter.once("test 2", function t2c () {
    }, 4);



    emitter.emit("test 1");
    emitter.emit("test 2");
    emitter.emit("test 1");
    emitter.emit("test 2");
    emitter.emit("test 1");
    emitter.emit("test 2");
    emitter.emit("test 2");
    emitter.emit("test 2");
    emitter.emit("test 2");


    console.log(emitter.log.logs(["emitted", "Executing"]));

## [scope.js](#scope.js "save: |jshint")

Use scope example. 


    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    emitter.scope("bob", {n:3});
    
    emitter.scope("jane", {n:8});
 
    emitter.scope("number requested", {count: 0});

    emitter.on("number requested", function (data, evObj) {
        var base = evObj.pieces[0], 
            scope = evObj.scopes[base],
            hscope = evObj.scopes["number requested"];

        console.log(scope.n, hscope);

        scope.n *= 2;
    
        hscope.count += 1;

    });


    emitter.emit("number requested:bob");

    emitter.emit("number requested:jane");
    
    emitter.emit("number requested:bob");

    console.log(emitter.log.logs());

## [arrays.js](#arrays.js "save: |jshint")

Array of handlers, sharing a context. 

    /*global require, console*/
    var EventWhen = require('../index.js'),
        emitter = new EventWhen(), 
        glob = {};

    emitter.makeLog();

    emitter.on("first", [
        function f1 (data, evObj) {
            var g = this; 
            g.n = data.n;
            console.log(evObj.ev, g.n);
        },
        function f2 (data, evObj) {
            var g = this, 
                ev = evObj.ev, 
                emitter = evObj.emitter;

            console.log(g.n, ev);
            if ( g.n < 10) {
                emitter.emit(ev, {n:(g.n+1)});
            } else {
                emitter.emit("done");
            }    
        }], glob );

    emitter.on("done", function d () {
        console.log("all done");
    });

    emitter.emit("first", {n: 5});

    console.log(emitter.log.logs());

## [action.js](#action.js "save: |jshint")

This is a demonstration of how the action ideas work. An action is a
string-invoked function. While events should be declaration of facts ("such
and such happened"), actions should be, well, active ("spell checking")

    /*global require, console*/
    var EventWhen = require('../index.js'),
        emitter = new EventWhen(), 
        glob = {};

    emitter.makeLog();

    emitter.action("fire test 2", function (data, evObj) {
        var g = this;
        g.record = 2;
        evObj.emitter.emit("test 2", data.msg);
    }, glob);

    emitter.on("test 1", "fire test 2");

    emitter.on("test 2", function t2 (data) {
        var g = this;
        console.log(data, g.record);
    }, glob);

    emitter.emit("test 1", {msg: "See you tonight."});

    console.log(emitter.log.logs());
