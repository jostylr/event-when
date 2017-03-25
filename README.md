## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

This is an event library, but one in which events and listeners are
coordinated through a single object. The emphasis throughout is on
coordinating the global flow of the program. 

It addresses what I find to be the pain points of JavaScript programming:
when does code execute and how does it have access to the objects it
needs? Most event libraries handle the first well enough for linear
sequences of event firing, but they fail when multiple events need to
happen, in any order, before triggering a response. It can also require
a lot of closures or globals to handle manipulating state from event
calls. This library is designed to address those needs. 

Most event libraries suggest making objects (such as a button) into
emitters; this is to promote separation of concerns, a good goal. But we
want to coordinate events from multiple sources. So to do this,
event-when is designed to allow you to attach the object to the
event/handler/emit.  It also allows you to listen for events before the
corresponding object exists. This is more like having listeners on a
form element responding to button clicks in the form. 

There are several noteworthy features of this library:

* [When](#when). This is the titular notion.  The `.when` method allows
  you to specify an event to emit after various specified events have all
  fired.  For example, if we call a database and read a file to assemble
  a webpage, then we can do something like 
    
    ```   
    emitter.when(["file parsed:jack", "database returned:jack"],
        "all data retrieved:jack");
    ``` 
    
    This is why the idea of a central emitter is particularly useful to
    this library's intent.
* [Scope](#scope). Events can be scoped. In the above example, each of
  the events are scoped based on the user jack. It bubbles up from the
  most specific to the least specific. Each level can access the
  associated data at all levels. For example, we can store data at the
  specific jack event level while having the handler at "all data
  retrieved" access it. Works the other way too. One can stash the
  scope into scope jack and the handler for `database returned` can
  access the name jack and its scope.  
* [Actions](#action). Events should be statements of fact. Actions can be
  used to call functions and are statements of doing. "Compile document"
  is an action and is a nice way to represent a function handler.
  "Document compiled" would be what might be emitted after the
  compilation is done.  This is a great way to have a running log of
  event --> action. To implement the log, you can run `emitter.makeLog()`
  and then when you want the event action, filter the logs with
  `emitter.log.logs("Executing action")` for an array of such statements. 
* Stuff can be attached to events, emissions, and handlers. Emits send
  data, handlers have contexts, and events have scope contexts.
* [Monitor](#monitor) One can place a filter and listener to monitor all
  emits and act appropriately. Could be great for debugging. 

Please note that no particular effort at efficiency has been made. This is
about making it easier to develop the flow of an application. If you need
something that handles large number of events quickly, this may not be the
right library. Benchmarking a simple emit can be found in benchmark.js.
On my MBA mid-2011, it does 5e4 emits in a half a second, 5e5 emits in
about 4.5 seconds while the native emitter does 5e5 in about a tenth of a
second.

### Using

In the browser, include index.js. It will store the constructor as
EventWhen in the global space. 

For node, use `npm install index.js` or, better, add it to the
package.json file with `--save` appended. 

Then require and instantiate an emitter:
```
var EventWhen = require('event-when');
emitter = new EventWhen();
```

### Object Types

* [Emitter](#emitter) This module exports a single function, the
  constructor for this type. It is what handles managing all the events.
  It could also be called Dispatcher.
* [Event Object](#event-object) This is the object that is passed to
  handlers. 
* [Handler](#handler) This is the object type that interfaces between
  event/emits and action/functions. 
* [Tracker](#tracker) This is what tracks the status of when to fire
  `.when` events.
* [Filter](#filter) This is a type that is used in filtering strings such
  as in filtering the logs. 


### Method specification

These are methods on the emitter object. 

* [emit](#emit)
* [emitCache](#emitCache)
* [monitor](#monitor)
* [when](#when)
* [on](#on)
* [off](#off)
* [once](#once)
* [stop](#stop)
* [cache](#cache)
* [action](#action)
* [actions](#actions)
* [scope](#scope)
* [scopes](#scopes)
* [events](#events)
* [handlers](#handlers)
* [error](#error)
* [queueEmpty](#queueempty)
* [makeLog](#log)
* [makeHandler](#makehandler)
* [filter](#filt)
* [serial](#serial)

---
<a name="emit"></a>
### emit(str ev, obj data, str timing) --> emitter

Emit the event.  

__arguments__

* `ev`  A string that denotes the event. 
* `data` Any value. It will be passed into the handler as the first
  argument. 
* `timing` One of "now", "momentary", "soon", "later" implying emission
  first on queue, last on queue, first on waiting list, last on waiting
  list, respectively. "Momentary" is the default if not provided as that
  will preserve the order of emitting. The waiting list is shifted once
  for each tick (or in the browser, setTimeout).

__return__

The emitter for chaining. The events may or may not be already emitted
depending on the timing. 

__convenience forms__ 

* `.now`  Event A emits B, B fires after the emitting handler finishes,
  but before other handler's for A finishes. This is the function
  calling model.
* `.momentary` Event A emits B, B fires after A finishes. This is more
  of a synchronous callback model. It is the same as `.emit` with the
  default setting.
* `.soon` Event A emits B then C, both with soon, then C fires after
  next tick. B fires after second tick.
* `.later` Event A emits B then C, both with later, then B fires after
  next tick. C fires after second tick.

__scope__ 

Note that if ev contains the event separator, `:` by default, then it
will be broken up into multiple events, each one being emitted. The
order of emission is from the most specific to the general (bubbling
up).  `emitter.scopeSep` holds what to split on.

In what follows, it is important to know that the handler signature 
is `(data, evObj)`.

As an example, if the event `a:b:c` is emitted, then `a:b:c` fires,
followed by `a:b`, followed by `a`. The scope objects available, however,
include that of all three of the emitted events as well as `b`, and `c`
separately. Thus, we can have an event `a:b` with a handler on `a` that
uses the scope of `b`. The name `b` can be found by accessing 
`base = evObj.pieces[0]` and the scope accessed from `evObj.scopes[base]`.
Note that `b` will not fire as a stand-alone event; it is just its scope
which can be found that way.

To stop the emitting and any bubbling, set `evObj.stop === true` in the
handler . To do more
fine-controlled stopping, you need to manipulate `evObj.events` which is
an array consisting of `[string ev, handlers]`.


Once the event's turn on the queue occurs, the handlers for all the
scopes fire in sequence without interruption unless an `emit.now` is
emitted. To delay the handling, one needs to manipulate
`evObj.emitter._queue` and `._waiting`. 


__example__

    emitter.emit("text filled", someData);
    emitter.now("urgent event");
    emitter.later("whenever", otherData);
    emitter.soon("i'll wait but not too long");
    // generic:specific gets handled then generic
    emitter.emit("generic:specific");

---
<a name="emitCache"></a>
### emitCache(str ev, obj data, str timing) --> emitter

Emit the event but cache it for once methods. Only the full exact event is
cached, not subforms. If the same event is called
multiple times, it overwrites the previous data without comment. Once
methods check for the cache for the full event. On handlers are not
affected by this. 

__arguments__

Same as emit.

* `ev`  A string that denotes the event. 
* `data` Any value. It will be passed into the handler as the first
  argument. 
* `timing` One of "now", "momentary", "soon", "later" implying emission
  first on queue, last on queue, first on waiting list, last on waiting
  list, respectively. "Momentary" is the default if not provided as that
  will preserve the order of emitting. The waiting list is shifted once
  for each tick (or in the browser, setTimeout).

__return__

The emitter for chaining. The events may or may not be already emitted
depending on the timing. 

__example__

    emitter.emitCache("text filled", someData);
    emitter.once("text filled", function (data) {
        //do something
    });

---
<a name="monitor"></a>
### monitor(listener arr/filter, listener) --> [filt, listener]

If you want to react to events on a more coarse grain level, then you can
use the monitor method. 

__arguments__

* no args. returns array of active listeners.
* `filter` Of filter type. Any event that matches the filter will be
  monitored. If an array of [filter, true] is passed in, that the filter
  will be negated. 
* `listener` This is a function that will respond to the event. It will
  receive the event being emitted, the data, and the emitter object
  itself. It has no context other than what is bound to it using .bind. 
* `listener arr` If listener array is passed in as first (and only)
  argument, then the array is removed from the relevant array. 

__returns__

Listener array of filter, function when assigning. Use this to remove the
monitoring. The returned array also has a `.orig` property containing the
original filter type.

__example__

    emitter.monitor(/bob/, function(ev, data, emitter) {
        console.log("bob in ", ev, " with ", data);
        emitter.emit("mischief managed");
    });

Note if you were to emit "bob" in the above monitor, then we would have an
infinite loop.


---
<a name="when"></a>
### when(arr/str events, str ev, str timing, bool reset, bool immutable, bool initialOrdering ) --> tracker 

This is how to do some action after several different events have all
fired. Firing order is irrelevant.

__arguments__

* `events` A string or an array of strings. These represent the events
  that need to be fired before emitting the event `ev`. The array
  could also contain a numbered event which is of the form `[event, # of
  times]`. This will countdown the number of times the event fires
  before considering it done. 
* `ev` This is the event that gets emitted after all the events have
  taken place. It should be an event string.
* `timing` Emits `ev` based on the timing provided, as in `.emit`.
* `reset` Setting this to true will cause this setup to be setup again
  once fired. The original events array is saved and restored. Default
  is false. This can also be changed after initialization by setting
  tracker.reset. 
* `immutable` Set the fifth argument to true in order to prevent this
  .when being merged in with other .whens who have the same emitting
  event. The default behavior is to combine .whens when they all emit the
  same event; the timing and reset are defaulted to the first .when though
  that can be modified with a return value. Note that immutables are still
  mutable by direct action on the tracker. 
* `initialOrdering` If true, the .when data will be returned in the order
  of originally adding the events, rather than the default of the emit
  order. To change this gloablly, change `emitter.initialOrdering = true`.
  Also, when true, events that are emitted with no data do fill up a slot,
  with data being null. 

__return__

Tracker object. This is what one can use to manipulate the sequence of
events. See [Tracker type](#tracker)

__note__

If an event fires more times than is counted and later the when is
reset, those extra times do not get counted. 

Also to get the tracker (assuming not immutable), then pass in empty array
and the event of interest.

There is a convenience method called `flatWhen`. This flattens the
emitted data. If the data had a single element in the array (just one
event fired with data A), then it emits A not an array containing A. If
there are multiple events with `[ev1, A], [ev2, B], ...` then it emits
`[A, B, ...]`.

There is another convenience method called `flatArrWhen`. This flattens the
emitted data but always returns an array, e.g., `[A]` or `[A, B, ...]`,
respectively in the above situation. 

__example__

    emitter.on("data gathered", function (data) {
        data.forEach(function (el) {
            switch (el[0]) {
                case "file read" :
                    // reports fileobj
                    console.log("file", el[1]);
                break;
                case "db returned" : 
                    // reports dbobj
                    console.log("db", el[1]);
                break;
            }
    });
    emitter.when(["file read", "db returned"], "data gathered");
    emitter.when("something more", "data gathered");
    emitter.emit("db returned", dbobj);
    emitter.emit("file read:some", fileobj);
    emitter.emit("something more");

emitter will automatically emit "data gathered" after third emit with
data `[ ["db returned", dbobj], ["file read", fileobj, "file read:some"]]`

Notice that if the event is a parent event of what was emitted, then the
full event name is placed in the third slot. 

---
<a name="on"></a>
### on(str ev, Handler f, obj context) --> Handler

Associates handler f with event ev for firing when ev is emitted.

__arguments__

* `ev` The event string on which to call handler f
* `f` The handler f. This can be a function, an action string, an array of
  handler types, or a handler itself.
* `context` What the `this` should be set to when invoking f. Defaults to
  `null`.

__return__

The Handler which should be used in `.off` to remove the handler, if
desired.

__f__

Ultimately handlers execute functions. These functions will be passed in
the data from the emit and an [event object](#event-object). It will be called in
the passed in context

__example__

    var record = {};
    emitter.on("json received", function(data) {
       this.json = JSON.parse(data);
    }, record);

---
<a name="off"></a>
### off(str/array/fun/reg events, handler fun, bool nowhen) --> emitter

This removes handlers.

__arguments__

This function behavior changes based on the number of arguments

* No arguments. This removes all handlers from all events. A complete
  reset.
* `events`. This is the event string to remove the handlers from. If
  nothing else is provided, all handlers for that event are removed. This
  could also be an array of event strings in which case it is applied to
  each one. Or it could be an Array.filter function or a RegExp that
  should match the strings whose events should have their handlers
  trimmed. Or it could be null, in which case all events are searched for
  the removal of the given handler. 
* `fun` This an object of type Handler. Ideally, this is the handler
  returned by `.on`. But it could also be a primitive, such as an action
  string or function.

    If fun is a boolean, then it is assumed to be `nowhen` for the whole
    event removal. If it is null, then it is assumed all handlers of the
    events should be removed. 

* `nowhen` If true, then it does not remove the handler associated with
  the tracker handler. 

__return__

Emitter for chaining. 

__example__

    // removes f from "full:bob"
    emitter.off("full:bob", f);
    // removes all handlers to all events with :bob as last 
    emitter.off(/\:bob$/);
    // removes all listed events
    emitter.off(["first", "second"], f);
    // function filter
    emitter.off(function (ev) { return (ev === "what");}, f);

---
<a name="once"></a>
### once(str event, handler f, int n, obj context) --> handler h

This attaches the handler f to fire when event is emitted. But it is
tracked to be removed after firing n times. Given its name, the default n
is 1.

__arguments__

* event Any string. The event that is being listened for.
* f Anything of handler type. 
* n The number of times to fire. Should be a positive integer. 
* context The object whose `this` f should have. 

Both n and context are optional and their positioning can be either way. 

__return__

The handler that contains both f and the counter.

__example__

    // talk with bob just once when event "bob" happens
    // this will be the object brief
    emitter.once("bob", "talk with bob", brief);
    // talk with jack three times, using brief each time
    emitter.once("jack", "talk with jack", 3, brief);

__note__

If you attach a `_label` property to your handler f, then the once will
get recorded in `emitter._onces` which one can use to monitor which onces
have fired and how many times remain. 

---
<a name="stop"></a>
### stop(filter toRemove, bool neg) --> emitter

This is a general purpose maintainer of the queue/waiting lists. It will
remove the events that match the first argument in some appropriate way.

__arguments__

* No argument. Removes all queued events.
* `toRemove` as boolean true. Current event on queue gets removed, any
  active handler is stopped.  
* `toRemove` Any [filter](#filter) type. If an event matches, it is
  removed. 
* `neg`. Reverse match semantics of filter type. 
    
__returns__

Emitter for chaining.

__example__

    // stop crazy from acting
    emitter.stop("crazy");
    // stop all events
    emitter.stop();
    // stop next event on queue
    emitter.stop(true);
    // stop all events with button in title
    emitter.stop(/^button/);

---
<a name="cache"></a>
### cache(str request/arr [ev, data, timing], str returned, fun process/str emit, str emit) -->  emitter

This is how to cache an event request. This will ensure that the given
event will only be called once. The event string should be unique and the
assumption is that the same data would be used. If not, one will have
problems. 

__arguments__

* `request` This is an event to be emitted. It can be either a string or
  an array with data and timing. If multiple events are needed, use a
  single event to trigger them. 
* `returned` This is the event to wait for indicating that the process is
  complete. Both request and returned should be the same for caching the
  request. But only the request is the cache key.
* `res` This takes in the data from the returned event and processes it.
  The return value is the data used by the final emit. If the emit string
  is empty, then the return value is not used and it is expected that res
  will do the emitting. It is a function that takes (data, cache args)
  called in the context of the event emitter. 
* `emit` This is what gets emitted upon obtaining the value. If res is not
  present, this can be the third argument and the data will simply be
  passed along.

---
<a name="action"></a>
### action(str name, handler, obj context) --> action handler

This allows one to associate a string with a handler for easier naming. It
should be active voice to distinguish from event strings.

__arguments__

* `name` This is the action name.
* `handler` This is the handler-type object to associate with the action. 
* `context` The context to call the handler in. 

__return__

* 0 arguments. Returns the whole list of defined actions.
* 1 argument. Returns the handler associated with the action.
* 2 arguments, second null. Deletes associated action.
* 2, 3 arguments. Returns created handler that is now linked to action
  string. 

__example__

This example demonstrates that an action should be an action sentence
followed by something that does that action. Here the emit event sends a
doc string to be compiled. It does so, gets stored, and then the emitter
emits it when all done. Note files is the context that the handler is
called in. 

    emitter.action("compile document", function (doc, evObj) {
        var files = this;
        var doneDoc = compile(doc);
        files.push(doneDoc);
        evObj.emitter.emit("document compiled", doneDoc);
    }, files);

---
<a name="actions"></a>
### actions(arr/bool/fun/reg/str filter, bool neg) --> obj

This returns an object with keys of actions and values of their handlers. 

__arguments__

* No argument or falsy first argument. Selects all actions for
  returning.      
* `filter` Anything of [filter](#filter) type. Selects all actions
  matching filter. 
* `neg` Negates the match semantics. 

__return__

An object whose keys match the selection and values are the corresponding
actions's value. If the value is an object, then that object is the same
object and modifications on one will reflect on the other. 

__example__

The following are various ways to return all actions that contain the
word bob. 

    emitter.actions("bob"); 
    emitter.actions(/bob/);
    emitter.actions(function (str) {
        return str.indexOf("bob") !== -1;
    });

In contrast, the following only returns the action with bob as the exact
name.

    emitter.actions(["bob"]);
    emitter.action("bob");

The first one returns an object of the form `{bob: handler}` while the
second returns the handler. 

---
<a name="scope"></a>
### scope(str ev, obj) --> scope keys/ obj / ev

This manages associated data and other stuff for the scoped event ev. 

__arguments__ 

* `ev` This is the full event to associate the information with. 
* `obj` This is whatever one wants to associate with the scope. 

__return__

* 0 arguments. Leads to the scope keys being returned. 
* 1 arguments. Leads to specified scope's object being returned.
* 2 arguments. Emitter returned for chaining.

__note__ 

The scope is associated not only just the full scope, but also its parts.
For example, the event "file:bob" would have associated scopes of "file",
"bob", and "file:bob". In a handler with signature `(data, evObj)`, this
can be accessed by `evObj.scopes.bob`, `evObj.scopes.file`, and
`evObj.scopes["file:bob"]`,  assuming there are scopes associated with
those strings. 

__example__

    emitter.scope("bob", {bd: "1/1"});
    
    emitter.scope("bob") === {bd:"1/1"};
    
    emitter.scope() === ["bob"];

---
<a name="scopes"></a>
### scopes(arr/bool/fun/reg/str filter, bool neg) --> obj

This returns an object with keys of scopes and values of their contexts. 

__arguments__

* No argument or falsy first argument. Selects all scopes for
  returning.      
* `filter` Anything of [filter](#filter) type. Selects all scopes matching
  filter. 
* `neg` Negates the match semantics. 

__return__

An object whose keys match the selection and values are the corresponding
scope's value. If the value is an object, then that object is the same
object and modifications on one will reflect on the other. 

__example__

Following the example of bob in scope...

    emitter.scopes("bob") === {bob: {bd :"1/1"} }
    
    emitter.scopes("bob", true) == {}

---
<a name="events"></a>
### events( arr/fun/reg/str partial, bool negate) --> arr keys

This returns a list of defined events that match the passed in partial
condition. 

__arguments__

The behavior depends on the nature of the first argument:

* String. Any event with the argument as a substring will match.
* RegExp. Any event matching the regex will, well, match.
* Function. The function should accept event strings and return true if
  matched. 
* Array. Any events that match a string in the passed in array will be
  returned. 

The second argument negates the match conditions. 

__returns__

An array of event strings that match the passed in criteria.

__example__

    // will match events gre, great, green...
    emitter.events("gre");
    // will match events ending with :bob
    emitter.events(/\:bob$/);
    // will match if only great. Could also pass in ["great"] instead.
    emitter.events(function (ev) {
        return ev === "great";
    });
    // grab events from emitter2 and match those in emitter1
    keys = emitter2.events();
    emitter1.events(keys);

---
<a name="handlers"></a>
### handlers(arr/fun/reg/str events, bool empty) --> obj evt:handlers

Get listing of handlers per event.

__arguments__

* `events`. Array of events of interest. 
* `events`. If function, reg, or string, then events are genertaed by
  events method. Note string is a substring match; to get exact, enclose
  string in an array. 
* `events`. If an array of `[filter, true]`, then it reverses the filter
  selection. 
* `events`. Falsy. The events array used is that of all events.
* `empty`. If true, it includes undefined events with handlers of null
  type. This will only happen if an array of events is passed in and
  there are non-matching strings in that array. 

__return__

Object with keys of events and values of arrays of Handlers.

__example__

Let's say we have handlers for the events "bob wakes up" and "bob sleeps".

    emitter.handlers("bob") === {
        "bob wakes up" : [handler1],
        "bob sleeps" : [handler2, handler3]
        }

---
<a name="error"></a>
### error()

This is where errors can be dealt with when executing handlers. It is
passed in the error object as well as the handler value, emit data,
event object, and executing context. The current full handler can be
found in the second entry of the cur array in the event object. 

If you terminate the flow by throwing an error, be sure to set
`emitter._looping` to false. 

This is a method to be overwritten, not called. 

__example__

    emitter.error = function (e, handler, data, evObj, context) {
        console.log( "Found error: " + e + 
            " while executing " + handler + 
            " with data " + data + 
            " in executing the event " + evObj.cur[0] + 
            " with context " + context ); 
        emitter._looping = false; 
        throw Error(e); 
    };

---
<a name="queueempty"></a>
The function `emitter.queueEmpty()` fires when all events that are waiting
have been called. The default is a noop, but one can attach a function to
the emitter that does whatever it wants. 

---
<a name="log"></a>
### makeLog() --> fun

This creates a log function. It is a convenient form, but the log
property should often be overwritten. If this is not invoked, then the
log is a noop for performance/memory. 

`emitter.log` expects a description as a first argument and then
whatever else varies. 

The log has various properties/methods of interest: 

* `_logs` This is where the carefully crafted logs are stored. This should
  be the most useful and meaningful statements for each logged event. 
* `_full`. This is a complete dumping of all passed in data to the log,
  including the description. 
* `fdesc` This is the object whose keys are the emitter.log descriptions
  and whose values are functions that produce the log input. This is not
  prototyped; if you delete a function, it is gone. This allows for easy
  removal of unwanted descriptions.
* `full` This produces the logs. Its arguments get passed to the filter
  function so strings match as substrings, regexs, arrays of substrings to
  match (exact matches did not seem useful for this), general function
  filters, and the ability to reverse the matches (maybe the array is
  useful for that). 
* `logs` This acts on the logs array instead of the full array.  Otherwise
  same as the full function. 
  
__example__

You should run the example in the example directory to get a feeling for
what the logs produce. 

    emitter.makeLog();

    ...

    emitter.log.logs(["emitted", "Executing"]);

---
<a name="makehandler"></a>
### makeHandler(value, context) --> handler

Create a handler. 

__arguments__

* `value` The handler type to wrap.
* `context` What the `this` should be for calling the handler.

__example__

    emitter.makeHandler(function yay () {}, obj);

---
<a name="filt"></a>
#### filter(filter type) --> function

This takes in something of [filter type](#filter) and outputs a function
that accepts a string and returns a boolean whose value depends on whether
a matching has occurred. 

---
<a name="serial"></a>
#### serial(obj) --> string

This takes in an object, or objects, and prints out a string suitable for
inspecting them. Functions are denoted by tick marks around the name, if
there is one. Multiple arguments are output as if they were all
encapsulated in an array. 


<a name="emitter"></a>
### Emitter Instance Properties

Each instance has, in addition to the prototype methods, the following
public properties: 

* `scopeSep` is the scope separator in the event parsing. The default is
  `:`. We can have multiple levels; the top level is the global event. 
* `count` tracks the number of events emitted. Can be used for
  logging/debugging. 
* `loopMax` is a toggle to decide when to yield to the next cycle for
  responsiveness. Default 1000. 
* `timing` The default timing for `.emit` which defaults to "momentary",
  i.e., appending to queue. 

It also has "private" variables that are best manipulated by the methods.

* `_handlers` has key:value of `event:[handler1, handler2,..]` and will
  fire them in that order. 
* `_queue` consists of events to be fired in this tick. These are the
  [event objects](#event-object) which get passed in as the second argument to
  the handlers. 
* `_waiting` is the queue for events to be fired after next tick.
* `_actions` has k:v of `action name: handler` The handler can be of type
  Handler or anything convertible to it. 
* `_scopes` has k:v of `scope name: object` When an event is emitted with
  the given scope, the object will be passed in and is accessible to any
  handler reacting to an event along the scope chain. 
* `_looping` tracks whether we are in the executing loop. 

---
<a name="handler"></a>
### Handler
Handlers are the objects that respond to emitted events. Generally they
wrap handler type objects. 

### Handler types

* function  `context -> f(data, evObj)` This is the foundation as
  functions are the ones that execute.  They are called with parameters
  `data` that can be passed into the emit call and `evObj` which has a
  variety of properties. See <a href="#event-object">evObj</a>.
* string.  This is an action string. When executed, it will look up the
  action associated with that string and execute that handler. If no
  such action exists, that gets logged and nothing else happens.
* handler. Handlers can contain handlers.
* array of handler types. Each one gets executed. This is how `.once`
  works.

### Handler methods

These are largely internally used, but they can be used externally.

* [summarize](#summarize)
* [execute](#execute)
* [removal](#removal)
* [contains](#contains)

---
<a name="summarize"></a>
#### summarize(value) --> str

This takes a handler and summarizes its structure. To give a meaningful
string to handlers for a summarize, one can add `._label` properties to
any of the value types except action strings which are their own "label". 

__arguments__

 * `value` or `this` is to be of handler type and is what is being
  summarized. 

__return__

The summary string.

__example__

    handler.summarize();

---
<a name="execute"></a>
#### execute(data, evObj, context, value) --> 

This executes the handler. 

__arguments__

* `data`, `evObj` get passed into the functions as first and second
  arguments. This is generated by the emit. 
* `context` The closest context will be used. If the function is bound,
  that obviously takes precedence.
* `value` This is largely internally used. 

__return__

Nothing. 

__example__

    handler = new Handler(function () {console.log(this.name, data);},
        {name: "test"});
    handler.execute("cool", {emitter:emitter});

---
<a name="removal"></a>
#### removal(ev, emitter) --> 

This removes the handlers from .when trackers. Used by .off.

__arguments__

* `this` This is called in the context of the handler.
* `ev` The event string to remove from the .when tracker.
* `emitter` The emitter object is passed in for actions and log ability.

__return__

Nothing.

__example__

    handler.removal("whened", emitter); 

---
<a name="contains"></a>
#### contains(target, htype) --> bool

This checks to see whether target is contained in the handler type at
some point.

__arguments__

* `target` Anything of handler type that is to be matched.
* `htype` Anything of handler type. This is the current level. If
  `htype` is not provided (typically the case in external calling), then
  the `this` becomes `htype`. 

__return__ 

It returns true if found; false otherwise.

__example__

    handler.contains(f);
    handler.contains("act");

---
### Tracker
<a name="tracker"></a>
Trackers are responsible for tracking the state of a `.when` call. It is
fine to set one up and ignore it. But if you need it to be a bit more
dynamic, this is what you can modify. 

### Tracker Properties

These are the instance properties

* `events` The list of currently active events/counts that are being
  tracked. To manipulate, use the tracker methods below.
* `ev` The event that will be emitted when all events have fired. It
  will emit the data from all the events in the form of an array of
  arrays: `[[event emitted, data], ...]`
* `timing` This dictates how the action is queued. 
* `reset` This dictates whether to reset the events after firing. 
* `original` The original events for use by reset/reinitialize.
* `handler` This is the handler that fires when the monitored events
  fire.
* `idempotent` Set to true if it is safe to emit the event multiple
  times. Default is false. 

### Tracker Methods

They all return tracker for chainability. 

* [add](#tracker-add)
* [remove](#tracker-remove)
* [go](#tracker-go)
* [cancel](#tracker-cancel)
* [reinitialize](#tracker-reinitialize)

<a name="tracker-add" />
#### add(arr/str events) 

Add events to tracking list.

__arguments__

This is the same form as the `events` option of `.when`. It can be a
string or an array of [strings / array of [string, number] ]. A string is
interpreted as an event to be tracked; a number indicates how many times
(additional times) to wait for.

You can use this to add a number of wait times to an existing event.

__example__

    t.add("neat");
    t.add(["neat", "some"]);
    t.add([["some", 4]]);

<a name="tracker-remove" />
#### remove(arr/str events)

Removes event from tracking list. 

__arguments__

Same as add events, except the numbers represent subtraction of the
counting. 

__alias__

`rem`

__example__

    t.remove("neat");
    t.remove(["neat", "some"]);
    t.remove([["some", 4]]);

<a name="tracker-go" />
#### go()

Checks to see whether tracking list is empty; if so, the waiting event
is emitted. No arguments. This is automatically called by the other
methods/event changes. 

<a name="tracker-cancel" />
#### cancel()

Cancel the tracking and abort with no event emitted. No arguments.

<a name="tracker-reinitialize" />
#### reinitialize()

Reinitializes the tracker. The existing waiting events get cleared and
replaced with the original events array. All data is wiped. No arguments.  

<a name="tracker-silence" />
#### silence()

This silences the passed in events or the last one added. In other words,
it will not appear in the list of events. If an event is applied multiple
times and silenced, it will be silent for the  

___
### Event Object
<a name="#event-object"></a>
Each emitted event calls the listener with the first argument as the data
and second argument as an event object. The event object consists of the
following properties: 

* `emitter` This is the emitter itself allowing one full access to
  emitting, oning, offing, whatever.
* `ev` This is the full event string that has been emitted.
* `data` This is the data object that is passed into the emit. It is the
  same as the first argument given to the handler. 
* `scopes` This is an object whose keys are the scope event strings and
  whose values are the objects stored under that scope. 
* `pieces` This is the result of splitting `ev` on the scope separator,
  reversed.
* `count` This is the value of the counter for which emit this was. 
* `timing` What the timing of the emit was.
* `events` This is an array that contains `[event substring, handlers]`.  The
  handlers array is a copy of the handlers attached to the named event. 
* `cur` This is changed after each handler handling. It is an array of
  `[event substring, handler]` It represents the current event and handler
  being executed. 
* `stop` This is not set, but if set to true, this will halt any further
  handlers from firing from this event object's events.

__example__

If the event "file:bob" was emitted with data "neat" , then the event object emitted would
be something like: 

    {emitter : emitter,
     ev : "file:bob",
     data : "neat",
     scopes : {file: {}, bob: {}, "file:bob" : {} },
     pieces : ["bob", "file"],
     count : 102,
     timing : "momentary",
     events : [ ["file:bob" , [handler1]], ["file", [handler2]] ],
     cur : ["file:bob", handler1]
    }

___
### Filter Type
<a name="#filter"></a>
Several of the methods accept something of filter type. This could be a
string, an array of strings, a regex, or a function. All of them are
being used to filter strings based on matching. Most of the methods also
allow for a negation boolean that will reverse the matching results. 

* String. These will match as a substring of the being tested string. So
  if "bob" is the filter object, it will match any string containing
  "bob". 
* Array of strings. If the string is in the array, it will match. This
  is an exact match. So if we have ["bob", "jane"], then this will match
  "bob" or "jane" and no other strings.
* Regex. If the string matches the regex, it matches. So /bob/ will
  match any string containing bob. 
* Function. If the function returns true, then it matches. 
* Array of `[filter type, boolean]` for functions that don't accept the
  second argument of negate. 
