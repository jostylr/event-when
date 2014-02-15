var EvW = require("../index.js");
var emitter = new EvW();

_"on:example"

// event with no data 
emitter.emit("no data passed in");
// plain event using data to say what happened
emitter.emit("got data", {dog : "fifi"});
// scoped event to have it passed around, `got data:dogs` called first, then `got data`
emitter.emit("got data:dogs", ["fifi", "barney"]);
// data need not be an object
emitter.emit("got a string", "hey there");

_"later:example"