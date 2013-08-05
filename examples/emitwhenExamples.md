# Emit When Examples

Here we will have a few different examples of using emit when. 

## [simple.js](#simple.js "save:")

Let's just do a basic simple example

    var EventWhen = require('../index.js');

    var emitter = new EventWhen();

    emitter.greeting = "hi dude";


    emitter.on("test 1 on", function () {
        console.log("test 1 starts");
        emitter.emit("test 1 finishes");
    });

    f = emitter.last;

    emitter.on("test 1 finsihes", function () {
        console.log("test 1 finishes");
        emitter.off("test 1 on", f);
        emitter.emit("test 1 on");
    });

    emitter.emit("test 1 on");