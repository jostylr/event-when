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
    emitter.when([["file parsed, "jack"], ["database returned", "jack"]],
        ["all data retrieved","jack"]);

    emitter.when(["file parsed, "database returned"],
        "all data retrieved", {scope: "jack"});

    ``` 
    
    This is why the idea of a central emitter is particularly useful to
    this library's intent.
* [Scope](#scope). Events can be scoped. In the above example, each of
  the events are scoped based on the user jack. The emitter hosts a scope
  object where data for scopes can be stashed. 
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
### emit(str ev, obj data) --> emitter

Emit the event. 

__arguments__

* `ev`  A string that denotes the event. The string up to the first colon
  is the actual event and after the first colon is the scope. 
* `data` Any value. It will be passed into the handler as the first
  argument. 

__return__

The emitter for chaining. The events may or may not be already emitted
depending on the timing. 

__scope__


Note that if ev contains the event separator, `:`,  then the
part after the colon is the scope. Handlers can react to the full string
or to just the first part. The scope comes along into the handler to be
called. The
order of handling is from the most specific to the general (bubbling
up).

In what follows, it is important to know that the handler signature 
is `(data, scope, emitter, context, event)`.

As an example, if the event `a:b:c` is emitted, then `a:b:c` fires,
followed by `a`. The scope for both is `b:c`. `emitter.scope('b:c')` will
call up the associated scope.

Once an emit happens, all currently associated handlers will be called and
those with limited time handling will be decremented. There is no
supported methods for stopping the handling. 

__example__

    emitter.emit("text filled", someData);
    emitter.emit("general event:scope", data);

---
<a name="emitCache"></a>
### emitCache(str ev, obj data) --> emitter

Emit the event but cache it for once methods. Only the full exact event is
cached, not subforms. If the same event is called
multiple times, the data gets added in the order of emitting. On methods
can opt-in to taking in the cache history. Once methods can opt-out, but
they suck up the data by default the number of times.  

__arguments__

Same as emit.

* `ev`  A string that denotes the event. 
* `data` Any value. It will be passed into the handler as the first
  argument. 

__return__

The emitter for chaining. 

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
### on(str ev, str action, function f, str/obj context ) --> Handler

Associates action with event ev for firing when ev is emitted. The
optionals are detected based on kind so the order and relevance is
optional.

__arguments__

* `ev` The event string on which to call the action
* `action` This is a string and is what identifies the handler. It should be written as a "do this" while the event is "something is done". 
* `f`. If an action string is not already defined with a function, one can
  associate a function with it by passing in one. The call signature is
  `data, scope, emitter, context`. The name of the function, if none, will
  be set to the action. 
* `context`. This is either a string that uses the named scope of emitter as the context or it is an object that can be used directly. 

__return__

The Handler which can be further manipulated, such as by once. It can be used to remove the
handler though the action string is preferred. 

__example__

This takes in some json, 

    emitter.on("json received", "parse json", function(data) {
      this.json = JSON.parse(data);
    }, record, {});

---
<a name="off"></a>
### off(str/array/fun/reg events, str action, bool nowhen) --> emitter

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
* `action`. This should be an action string that identifies what to
  remove. 

    If action is a boolean, then it is assumed to be `nowhen` for the whole
    event removal. If it is null, then it is assumed all handlers of the
    events should be removed. 

* `nowhen` If true, then it does not remove the handler associated with
  the tracker handler. 

__return__

Emitter for chaining. 

__example__

    // removes action `empty trash` from "full:bob"
    emitter.off("full trash:bob", "empty trash");
    // removes all handlers to all events with :bob as last 
    emitter.off(/\:bob$/);
    // removes all listed events that have action "whatever"
    emitter.off(["first", "second"], "whatever");
    // function filter
    emitter.off(function (ev) { return (ev === "what");}, "action now");

---
<a name="once"></a>
### once(str event, action, int n, f, context) --> handler h

This attaches the actopm to fire when event is emitted. But it is
tracked to be removed after firing n times. Given its name, the default n
is 1.

__arguments__

* event Any string. The event that is being listened for.
* action. A string to be listed as the action taken. 
* n The number of times to fire. Should be a positive integer. 
* f, context. These are on arguments. See on's optional arguments. Should be after n; if n is
  not present, they can safely start in argument 3. 

__return__

The handler produced by the underlying 'on' call; it has the additional
property of a count. 

__example__

    // talk with bob just once when event "bob" happens
    // this will be the object brief
    emitter.once("bob", "talk with bob", brief);
    // talk with jack three times, using brief each time
    emitter.once("jack", "talk with jack", 3, brief);

---
<a name="stop"></a>
### stop(filter toRemove, bool neg) --> emitter

This is a general purpose maintainer of the queue. It will
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
### action(str name, f function, ) --> depends

This allows one to associate a string with handler primitive for easier naming. It
should be active voice to distinguish from event strings.

__arguments__

* `name` This is the action name.
* `f` The function action to take. 
* `context` Either a string to call the scope from the emitter when
  invoking f or an object directly. 

__return__

* 0 arguments. Returns the whole list of defined actions.
* 1 argument. Returns the action object associated with the action.
* 2 arguments, second null. Deletes associated action. Returns that
  deleted action object.
* 2, 3 arguments. Returns emitter. 

__example__

This example demonstrates that an action should be an action sentence
followed by something that does that action. Here the emit event sends a
doc string to be compiled. It does so, gets stored, and then the emitter
emits it when all done. Note files is the context that the handler is
called in. 

    emitter.action("compile document", function (data, scope, emitter) {
        var files = this;
        var doneDoc = compile(data);
        files.push(doneDoc);
        emitter.emit("document compiled", doneDoc);
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
### scope(str key, obj) --> scope keys/ scope obj / emitter

This manages associated data and other stuff for the scoped event ev. 

__arguments__ 

* `key` This is the scope name 
* `obj` This is whatever one wants to associate with the scope. It
  overwrites what is there if present. The value null for `obj` will
  delete the scope. 

__return__

* 0 arguments. Leads to the scope keys being returned. 
* 1 arguments. Leads to specified scope's object being returned.
* 2 arguments (str, whatever). Stores obj as scope. Emitter returned for chaining.
* 2 arguments (true, key). This returns a scope, creating a new Map() if
  needed. 

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
scope's value. If the value is an object, then the returned object values
are live and modifications on one will reflect on the other. 

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

* `count` tracks the number of events emitted. Can be used for
  logging/debugging. 
* `loopMax` is a toggle to decide when to yield to the next cycle for
  responsiveness. Default 1000. 

It also has "private" variables that are best manipulated by the methods.

* `_handlers` has key:value of `event:[handler1, handler2,..]` and will
  fire them in that order. 
* `_queue` consists of events to be fired in this tick. These are the
  [event objects](#event-object) which get passed in as the second argument to
  the handlers. 
* `_actions` has k:v of `action name: handler` 
* `_scopes` has k:v of `scope name: object` This can be accessed through
  the function scope or the native get, set. 
* `_looping` tracks whether we are in the executing loop. 

---
<a name="handler"></a>
### Handler
Handlers are the objects that respond to emitted events. They consist of
an action string that describes and names the handler, a function to
execute, and a context in which to execute. Handlers may also have various
properties added to them, such as once handlers having a count. 

In defining a handler, neither a function nor context is strictly
required. If a function is not provided, it is assumed that the action
string names a function in the action table to use. This is a dynamic
lookup at the time of the emit. 

A useful setup is to have a function in the action table, but to create a
handler to respond to specific events with a given context. The context
can either be a string, in which case it is taken to be a scope object in
the emitter, or an object which will store the data. 


### new Handler (str action, fun f, str/obj context, emitter) -> handler

* `action`. A descriptive text saying what will happen. 
* `f`. The function to execute. This is optional in the definition of a
  handler, but ultimately required to do something with it. The signature
  of the function is `f(data, scope, emitter, context)` called with a
  `this` that also points to the context. 
* `context`. String to name the scope to use for the function as `this` 


### Handler methods

These are largely internally used, but they can be used externally.

* [execute](#execute)
* [removal](#removal)
* [decrement](#decrement)


---
<a name="execute"></a>
#### execute(data, str scope, emitter, str event) --> 

This executes the handler. 

__arguments__

* `data`. This is the data from an emit event.
* `scope`. The colonated part of the event. It gets evaluated into a scope
  object from emitter and that is passed along. A new map is created if
  there is no scope. 
* `emitter` The emitter object.
* `event` The full event string that was called in the emit. Usually not
  needed, but could be useful. This is passed along into the function
  handler as the fifth argumet. 

__note__

The handler will find a function to call or emit an error. This is either
from when the `on` event was created or from an action item. The context
object, also from one of those things, will be sent along as the fourth
argument in the call of the function. 

__return__

Handler for chaining. 

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
<a name="decrement"></a>
some docs

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
