/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.scope("bob", {n:3});

emitter.scope("jane", {n:8});

emitter.scope("number requested", {count: 0});

emitter.on("number requested", function (data, scope, emitter) {
    scope = emitter.scope(scope);
    var hscope = emitter.scope("number requested");

    console.log(scope.n, hscope);

    scope.n *= 2;

    hscope.count += 1;

});


emitter.emit("number requested:bob");

emitter.emit("number requested:jane");

emitter.emit("number requested:bob");

console.log(emitter.log.logs());
