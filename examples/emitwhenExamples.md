# Emit When Examples

Here we will have a few different examples of using emit when. 

## [simple.js](#simple.js "save: |jshint")

Let's just do a basic simple example

    /*global require, console*/
    var EventWhen = require('../index.js'),
        emitter = new EventWhen(), 
        f;

    emitter.makeLog();


    emitter.on("test 1 on", function () {
        console.log("test 1 starts");
        emitter.emit("test 1 finishes");
    });


    f = emitter.last;

    emitter.on("test 1 finishes", function () {
        console.log("test 1 finishes");
        emitter.off("test 1 on", f);
        emitter.emit("test 1 on");
    });

    emitter.emit("test 1 on");

    emitter.log.print();
    emitter.log.filter(function (str) {
        if (str.search("test 1") === -1) {
            return false;
        } else {
            return true;
        }
    });


## [when.js](#when.js "save:| jshint")

Now let's involve some when action.

    /*global require, console, process*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    var log = [];

    emitter.on("alice fires", function () {
        log.push("alice fired");
    });

    emitter.on("bob fires", function () {
        log.push("bob fired");
    });

    emitter.on("string notes both fired", function (data) {
        log.push("from a string, both have fired " + data.alice);
    });

    emitter.on("array notes both fired", function (data) {
        log.push("string in an array, both have fired with data " + data.alice );
    });

    emitter.when(["alice fires", "bob fires"], "string notes both fired", true);
    emitter.when(["alice fires", "bob fires"], function (data) {
        log.push("single function fires with data " + data.alice); 
    });
    emitter.when( ["alice fires", "bob fires"], ["array notes both fired", function (data) {
        log.push("array function fires data " + data.alice);
    }]);
    emitter.when([["alice fires",2]], function (data) {
        log.push("alice fired twice with data " + data.alice );
    });
    emitter.when("bob fires", function () {
        log.push("just care about bob firing");
    });

    emitter.on("done", function () {
        // console.log(data); 
    });

    emitter.on("near first", function () {
        log.push("called immediately");
    });

    emitter.emit("alice fires");
    emitter.emit("bob fires", {alice: "rocks"});

    emitter.emit("alice fires");
    emitter.emit("bob fires", {alice: "awesome"});

    emitter.emit("done", log);

    emitter.emit("near first", {}, true); 

    process.on("exit", function () {
        emitter.log.print();
        console.log(log);
    });


## [once.js](#once.js "save: | jshint")

Testing the once method

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    emitter.once("test 1", function () {
        console.log("test 1 fires");
        emitter.emit("test 2");
    });


    emitter.once("test 2", function() {
        console.log("never fires");
    }, 0);

    emitter.once("test 2", function () {
        console.log("test 2 fires");
    }, 2);

    emitter.once("test 2", function() {
        console.log("impatient test 2 handler");
    }, 4, true);

    emitter.once("test 2", function() {
        console.log("last test 2 handler");
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


    emitter.log.print();

## [handler.js](#handler.js "save: |jshint")

Checking out the binding/arguments for handlers.

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    var global = {fred : 1};

    var n = 4;
    var something = [3];

    var fredf = function (jack, jill, data) {
        jack += 1;
        this.jack = jack;
        jill.push(5);
        this.jill = jill;
        this.fred += data.inc;
    };


    emitter.on("fires",  [global, fredf, n, something]);


    emitter.emit("fires", {inc : 3});

    emitter.log.print();
    console.log(global, n, something);
