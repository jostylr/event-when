## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

This is an event library, but one in which events and listeners are coordinated through a single object. The emphasis throughout is on coordinating the global flow of the program. 

If you wish to attach event emitters to lots of objects, such as buttons, this library is probably not that useful. 

Instead, you attach the buttons to the events and/or handlers. 

There are several noteworthy features of this library:

* When. This is the titular notion. The `.when` method allows you to specify an event to emit after various specified events have all fired. For example, if we call a database and read a file to assemble a webpage, then we can do something like `emitter.when(["file parsed:jack.txt", "database returned:jack"], "all data retrieved:jack");
* Scope. Events can be scoped. In the above example, each of the events are scoped based on the user jack. It bubbles up from the most specific to the least specific. Each level can access the associated data at all levels. For example, we can store data at the specific jack event level while having the handler at "all data retrieved" access it. Works the other way too.
* Actions. Events should be statements of fact. Actions can be used to call functions and are statements of doing. "Compile document" is an action and is a nice way to represent a function handler. "Document compiled" would be what might be emitted after the compilation is done. This is a great way to have a running log of event --> action. 
* Stuff can be attached to events, emissions, and handlers. The convention is that the first bit is `data` and should be JSONable. The second bit is `myth` and can be functions or complicated "global" state objects not really intended for inspection. I find separating the two helps debugging greatly. 

Please note that no effort at efficiency has been made. This is about making it easier to develop the flow of an application. If you need something that handles large number of events quickly, this may not be the right library. 

### Install

Install using `npm install event-when` though I prefer doing it via package.json and `npm install`. 

### Method specification

These are methods on the emitter object. 

* [Emit](#emit)
* [When[(#when)

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

* `.now`  Event A emits B, B fires before A finishes. This is the function calling model.
* `.momentary` Event A emits B, B fires after A finishes. This is more of a synchronous callback model. 
* `.soon` Event A emits B then C, both with soon, then C fires after next tick. B fires after second tick.
* `.later` Event A emits B then C, both with later, then B fires after next tick. C fires after second tick.

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

---
<a name="when" />
### when(arr/str events, str ev, obj data, obj myth, str timing, bool reset ) --> tracker 

This is how to do som action after several different events have all fired. Firing order is irrelevant. 

__arguments__

* `events` A string or an array of strings. These represent the events that need to be fired before taking the specified action. The array could also contain a numbered event which is of the form `[event, # of times]`. This will countdown the number of times the event fires before considering it done. 
* `ev` This is the event that gets emitted after all the events have taken place. It should be an event string.
* `timing` Emits `ev` based on the timing provided, as in `.emit`.
* `reset` Setting this to true will cause this setup to be setup again once fired. The original events array is saved and restored. Default is false. This can also be changed after initialization by setting tracker.reset. 

__return__

Tracker object. This is what one can use to manipulate the sequence of events. See [Tracker type](#tracker)

__example__

    //have two events trigger the calling of action compile page
    emitter.when(["file read:dog.txt", "db returned:Kat"], "data gathered");
    //have two events trigger the emitting of all data retrieved
    emitter.when(["file read:dog.txt", "db returned:Kat"], "all data retrieved:dog.txt+Kat");

<a name="on" />

### on(str ev, Handler f, obj data, obj myth) --> Handler

Associates handler f with event ev for firing when ev is emitted.

__arguments__

* `ev` The event string on which to call handler f
* `f` The handler f. This can be a function, an action string, an array of handler types, or a handler itself.
* `data` If there is any data that f needs access to.
* `myth` If there is any objects that f needs access to.

__return__

The Handler which should be used in `.off` to remove the handler, if desired. 

---

<a name="off" />

### off(str/array events, handler fun, bool nowhen) --> emitter

This removes handlers.

__arguments__

This function behavior changes based on the number of arguments

* No arguments. This removes all handlers from all events. A complete reset.
* `events`. This is the event string to remove the handlers from. If nothing else is provided, all handlers for that event are removed. This could also be an array of event strings in which case it is applied to each one. Or it could be null, in which case all events are searched for the removal of the given handler. 
* `fun` This an object of type Handler. Ideally, this is the handler returned by `.on`. But it could also be a primitive, such as an action string or function.

    If fun is a boolean, then it is assumed to be `nowhen` for the whole event removal. If it is null, then it is assumed all handlers of the events should be removed. 

* `nowhen` If true, then it does not remove the handler associated with the removal of a tracker handler. 

__return__

emitter for chaining. 

__example__

    //todo. 

_"once:doc"

_"stop:doc"

_"events:doc"

_"handlers:doc"

_"actions:doc"

### Object Types

* Emitter. This module exports a single function, the constructor for this type. It is what handles managing all the events. It really should be called Dispatcher. 
* [Handler](#handler)
* [Tracker](#tracker)

_"handler:doc"

Trackers are responsible for tracking the state of a `.when` call. It is fine to set one up and ignore it. But if you need it to be a bit more dynamic, this is what you can modify. 
### Tracker Properties

These are the instance properties

* `events` The list of currently active events/counts that are being tracked. To manipulate, use the tracker methods below.
* `ev` The action that will be taken when all events have fired. This will use the     passed in data and myth objects for the handler slot in the passin object.
* `timing` This dictates how the action is queued. 
* `reset` This dictates whether to reset the events after firing. 
* `original` The original events for use by reset/reinitialize.
* `handler` This is the handler that fires when the monitored events fire.

### Tracker Methods

They all return tracker for chainability. 

*[add](#tracker-add)
 
<a name="tracker-add" />
#### add(arr/str events) 

Add events to tracking list.

__arguments__

This is the same form as the `events` option of `.when`. It can be a string or an array of [strings / array of [string, number] ]. A string is interpreted as an event to be tracked; a number indicates how many times (additional times) to wait for.

You can use this to add a number of wait times to an existing event.

<a name="tracker-remove" />
#### remove(arr/str events)

Removes event from tracking list. 

__arguments__

Same as add events, except the numbers represent subtraction of the counting. 

<a name="tracker-go" />
#### go()

Checks to see whether tracking list is empty; if so, the waiting event is emitted. No arguments. This is automatically called by the other methods/event changes. 

<a name="tracker-cancel" />
#### cancel()

Cancel the tracking and abort with no event emitted. No arguments.

<a name="tracker-reinitialize" />
#### reinitialize()

Reinitializes the tracker. The existing waiting events get cleared and replaced with the original events array. No arguments. 