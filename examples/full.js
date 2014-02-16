var EvW = require("../index.js");
var emitter = new EvW();

_"on:example"

// event with no data 
emitter.now("no data passed in");
// plain event using data to say what happened
emitter.now("got data", {dog : "fifi"});
// scoped event to have it passed around, 
// `got data:dogs` called first, then `got data`
// both data and a myth object passed in
emitter.now("got data:dogs",
     ["fifi", "barney"], 
     {dog: function (name) {return "great, "+name;} }
);
// data need not be an object
emitter.now("got a string", "hey there");

// the events give the order. Note all are queued before any event is handled
var data = {enters: "dog"}
emitter.later("third", data);
emitter.later("second", data, true);
emitter.later("fourth", data);
emitter.later("first", data, true);

_"later:example"