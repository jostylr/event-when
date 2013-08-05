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



    emitter.on("test 1 on", function () {
        console.log("test 1 starts");
    });


    emitter.on("test 2 on", function () {
        console.log("test 2 starts");
    });


    emitter.on("test 1 finishes", function () {
        console.log("test 1 finishes");
    });

    emitter.on("all tests on", function (data) {
        console.log("all tests done:", data.me);
    });

    emitter.emitWhen("all tests on", ["test 1 on", "test 2 on"]);

    emitter.emit("test 1 on");

    emitter.emit("test 2 on", {me: "rocks"});
