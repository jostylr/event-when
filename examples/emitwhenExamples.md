# Emit When Examples

Here we will have a few different examples of using emit when. 

## [simple.js](#simple.js "save: |jshint")

Let's just do a basic simple example

    /*global require, console*/
    var EventWhen = require('../index.js'),
        emitter = new EventWhen(), 
        f;



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

## [when.js](#when.js "save:| jshint")

Now let's involve some when action.

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();

    var log = [];
    emitter.log = function () {
        //log.push(arguments);
    };

    emitter.on("alice fires", function () {
        log.push("alice fired");
    });

    emitter.on("bob fires", function () {
        log.push("bob fired");
    });


    emitter.on("string notes both fired", function (data) {
        console.log("woot");
        log.push("from a string, both have fired" + data.alice);
    });

    emitter.on("array notes both fired", function (data) {
        log.push("string in an array, both have fired with data " + data.alice );
    });


    emitter.emitWhen("string notes both fired", ["alice fires", "bob fires"], false, true);
    emitter.emitWhen(function (data) {
        log.push("single function fires with data " + data.alice); 
    }, ["alice fires", "bob fires"]);
    emitter.emitWhen(["array notes both fired", function (data) {
        log.push("array function fires data " + data.alice);
    }],  ["alice fires", "bob fires"]);
    emitter.emitWhen(function (data) {
        log.push("alice fired twice with data " + data.alice );
    }, [["alice fires",2]]);
    emitter.emitWhen(function () {
        log.push("just care about bob firing");
    },  "bob fires");


    emitter.on("done", function (data) {
        console.log(data); 
    });

    emitter.on("near first", function (data) {
        log.push("called immediately");
    });

    emitter.emit("alice fires");
    emitter.emit("bob fires", {alice: "rocks"});

    emitter.emit("alice fires");
    emitter.emit("bob fires", {alice: "awesome"});

    emitter.emit("done", log);

    emitter.emit("near first", {}, true); 

    process.on('exit', function () {
        console.log(log);
    });

## [once.js](#once.js "save: | jshint")

Testing the once method

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();


    emitter.once("test 1", function () {
        console.log("test 1 fires");
    });

    emitter.once("test 2", function () {
        console.log("test 2 fires");
    }, 2);

    emitter.emit("test 1");
    emitter.emit("test 2");
    emitter.emit("test 1");
    emitter.emit("test 2");
    emitter.emit("test 1");
    emitter.emit("test 2");
