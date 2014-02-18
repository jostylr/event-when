## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

This is an event library, but one in which events and listeners are coordinated through a single object. The emphasis throughout is on coordinating the global flow of the program. 

If you wish to attach event emitters to lots of objects, such as buttons, this is library is probably not that useful. 

Instead, you attach the buttons to the events and/or handlers. 

There are several noteworthy features of this library:

* When. This is the titular notion. The `.when` method allows you to specify actions to take when various specified events have all fired. For example, if we call a database and read a file to assemble a webpage, then we can do something like `emitter.when(["file parsed:jack.txt", "database returned:jack"], "all data retrieved:jack");
* Scope. Events can be scoped. In the above example, each of the events are scoped based on the user jack. It bubbles up from the most specific to the least specific. Each level can access the associated data at all levels. For example, we can store data at the specific jack event level while having the handler at "all data retrieved" access it. Works the other way too.
* Actions. Events should be statements of fact. Actions can be used to call functions and are statements of doing. "Compile document" is an action and is a nice way to represent a function handler. "Document compiled" would be what might be emitted after the compilation is done. This is a great way to have a running log of event --> action. 
* Stuff can be attached to events, emissions, and handlers. The convention is that the first bit is `data` and should be JSONable. The second bit is `myth` and can be functions and complicated "global" state objects not really intended for inspection. I find separating the two helps debugging greatly. 

Please note that no effort at efficiency has been made. This is about making it easier to develop the flow of an application. If you need something that handles large number of events quickly, this may not be the right library. 

### Install

Install using `npm install event-when` though I prefer doing it via package.json and `npm install`. 

### Method specification

* [Emit](#emit)

---
<a name="emit" />
### emit(str ev, obj data, obj myth, str timing) --> emitter

Emit the event.  

__arguments__

* `ev`  A string that denotes the event. 
* `data` Any value. It will be passed into the handler. Expected to be JSONable; great for logging. Think properties.
* `myth` Also any value. Expected to be an object of functions, think methods or messy state objects. 
* `timing` One of "now", "momentary", "soon", "later" implying emission first on queue, last on queue, first on next cycle, last on next cycle, respectively. Now is the default if not provided. 

__return__

The emitter for chaining. The events may or may not be already emitted depending on the timing. 

__convenience forms__ 

* `.now`  Event A emits B, B fires before A finishes.
* `.momentary` Event A emits B, B fires after A finishes.
* `.soon` Event A emits B then C both with soon, then C fires after next tick. B fires after second tick.
* `.later` Event A emits B then C both with later, then B fires after next tick. C fires after second tick.

__scope__ 
Note that if ev contains the [event separator](#event-separator) then it will be broken up into multiple events, each one being emitted. The order of emission is from the most specific to the general (bubbling up). 

To stop, the bubbling, clear the `evObj.events` array. 

To modify the later events to emit immediately or later, change `evObj.q` and `evObj.action`. 

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