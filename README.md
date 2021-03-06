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
* [monitor](#monitor)
* [when](#when)
* [on](#on)
* [off](#off)
* [once](#once)
* [storeEvent](#storeEvent)
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

The emitter for chaining. The events may or may not be already
handled by their handlers (generally will be, but if it hits the
loop max, then it clocks over. 

__scope__


Note that if ev contains the event separator, `:`,  then the
part after the colon is the scope. Handlers can react to the full string
or to just the first part. The scope comes along into the handler to be
called. The
order of handling is from the most specific to the general (bubbling
up).

In what follows, it is important to know that the handler signature is
`(data, scope, context, event)`. Note that scope is string while the
context may or may not, depending on how the handler was setup. The
function is called with the `this` pointing to the handler which contains
a reference to emitter as well as other items. 

As an example, if the event `a:b:c` is emitted, then `a:b:c` handlers
fire, followed by handlers for `a`. The scope for both is `b:c`.
`emitter.scope('b:c')` will call up the associated scope though generally
the context of the handler is more appropriate. 

Once an emit happens, all currently associated handlers will be called and
those with limited time handling will be decremented. There are no
supported methods for stopping the handling. 

__example__

    emitter.emit("text filled", someData);
    emitter.emit("general event:scope", data);
    emitter.on("general event", "respond with scoped target~");
    emitter.emit("general event:scope", data);

---
<a name="storeEvent"></a>
### storeEvent(str ev, off) --> emitter

This will setup a handler for the event `ev` which will cache its data and
event object. This will be stored in the scope `_cache` value. 

__arguments__

Same as emit.

* `ev` A string that denotes the event. 
* `off` If set to true, this turns off the caching and eliminates it. To
  turn it off without deleting the cache, use `emitter.off(ev, "_cache")`.
  

__return__

The emitter for chaining. 

__example__

    emitter.storeEvent("text filled");
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
### when(arr/str events, str ev ) --> tracker 

This is how to do some action after several different events have all
fired. Firing order is irrelevant. The order is determined by how it was
added. 

__arguments__

* `events` A string or an array of strings. These represent the events
  that need to be fired before emitting the event `ev`. 
* `ev` This is the event that gets emitted after all the events have
  taken place. It should be an event string.

__return__

Tracker object. This is what one can use to manipulate the sequence of
events. See [Tracker type](#tracker)

The tracker is listed under the scope of the event to emit. 

__string arguments__

The events and the event to emit both have a mini-dsl that one can use to
modify the output. For both, the dsl is initiated with a `!`. The last
exclamation point is the one to be used. If you want a `!` in the string other
than that, you can end the string with a period and nothing after it to
avoid accidental invocations. 

The syntax is basically as follows: `!timing Pipes Mode` Spacing is
optional.

For incoming messages, the timing refers to how  many times to listen for
the event before allowing the when to be emitted. It can have a second
number which says how many more times it will listen and record the data,
but it will not stop the emitting. The timing should be either an integer
or the string `oo` representing infinity. A leading infinity does not make
sense as the .when would never be emitted. So if there is a single `oo`,
then it is assumed to be a non-blocking event. One can have `0` as the
leading time which means no blocking as well. The default is euivalent to
`1 0` and  `oo` is equivalent to `0oo`.  Spaces are optional between a
number and `oo`. 

The pipes should be of the form `=>pipename` and basically feeds the data
into a data cleaning/formatting function, registered in the `.pipes`
command. These should ideally be simple, functional units. The signature
of the pipe is `(incoming, existing value) --> value`. The value is used
based on the default last character, which is to simply replace it. 

The mode is a single character. For incoming events, these should be: 

* `=`. This replaces whatever existing value for the event there is with
  the incoming. 
* `-`. Do not record the event at all. Just a silent listener.
* `,`. The value will be an array and each emission adds another element
  to the array.
* `+`. This adds the value with the existing value and uses that to
  replace. A shortcut from a pipe that could do the same. 
* `*`. This multiples the incoming and existing. 

For the toEmit event, there is only a single number which is relevant. The
number indicates how many times to reset the `.when`.  `oo` will mean the
`.when` always resets. 

The pipe portion of the syntax is an opportunity to work on the data
before emitting. 

The last character has the following implications: 

* `,` This issues the event as an array of the event values. They are
  arranged in the order that the events were added to the `.when`, not as
  emitted. This is the default. 
* `&` This returns a Map of `[event, data]`. It will have the order of
  being added to `.when`. This will have the event listed in the fashion
  it was listed. That is, if there is no scope for the `.when` but was
  emitted with one, it is ignored by default though the pipe could do
  something with it as part of the data.
* `=`, This is the same as the `,` except that if there is only one value,
  then it returns that value instead of an array.
* `@`  This is similar to the one returning a Map, but it returns an array
  instead. 
* `^` This will return an array of `[event, data]`, similar to `\`, but it
  does so in the order of emitting. This will report the same event being
  fired multiple times (if being listened for that) interspersed. The
  value given to the event's pipe is always null. This does include the
  full event (with scope). 


__scope__


If an incoming event is listed with `:` at the end (before the last `!` if
present), then it will have a scope added to it. If the third argument of
`.when` is present, then that becomes the scope. If not present, then the
scope is that of the event to be emitted's scope, if that is present.  If
neither is present, then there is no scope. 

__note__

If an event fires more times than is counted and later the when is
reset, those extra times do not get counted. 

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
data `[ fileobj, dbobj, null ]`

Notice that if the event is a parent event of what was emitted, then the
full event name is placed in the third slot. 

---
<a name="on"></a>
### on(str ev, str action, function f, obj context ) --> Handler

Associates action with event ev for firing when ev is emitted. The
optionals are detected based on kind so the order and relevance is
optional.

__arguments__

* `ev` The event string on which to call the action. If this ends in `~`,
  then this signals that there shold be a scope object, which will be
  created now if it does not exist. 
* `action` This is a string and is what identifies the handler. It should be written as a "do this" while the event is "something is done". If it has a colon in it, then the part after the colon is considered a context that can be used to distinguish different actions. In particular, if there is no context object passed in, then this string is used to identify a scope that gets passed in. 
* `f`. If an action string is not already defined with a function, one can
  associate a function with it by passing in one. The call signature is
  `data, scope, emitter, context`. The name of the function, if none, will
  be set to the action. 
* `context`. This is either a string that uses the named scope of emitter as the context or it is an object that can be used directly. If it ends in `~`, then it will be called in as the object and created now if necessary. 

__return__

The Handler which can be further manipulated, such as by once. It can be used to remove the
handler though the action string is preferred. 

The Handler has a variety of properties that can be used to understand the
action to be taken: 

* `event`. This is the event that it is listening for. 
* `fullAction`. This is the full action string. 
* `action`. This is the action that may be used to look up the function to
  use. 
* `emitter`. The emitter is stored here for use in the execute call.
* `context`. The context object, if there is one. 
* `contextStr`. The context string, if there is one. 

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
### action(str name, f function, obj context ) --> depends

This allows one to associate a string with handler primitive for easier
naming. It should be active voice to distinguish from event strings.
Action with function is the primary use, but one can also have contexts
associated with it. Most of the time it is better to associate a context
with the on operation.

__arguments__

* `name` This is the action name. If it has a colon, then a context can be
  called upon from the scopes by that name. A `:*` will reflect the action
  name as the context name. 
* `f` The function action to take. 
* `context` If present, it is what is passed along to the execution of the
  handler in the third slot. 
  
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
* 2 arguments (str, whatever). Stores obj as scope. Emitter returned for
  chaining.
* 2 arguments (true, key). This returns a scope, creating a object (with
  no default properties) if needed. 

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
* `events`. If function, reg, or string, then events are generated by
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


---
<a name="execute"></a>
#### execute(data, str scope) --> nothing

This executes the handler. `this === handler`

__arguments__

* `data`. This is the data from an emit event.
* `scope`. A string which is the scope for the event. This is distinct
  from the context which is generally used for an action to modify
  something or other. The scope is more about matching up the event with a
  partiuclar action and context. 

__note__

The handler will find a function to call or emit an error. This is either
from when the `on` event was created or from an action item. 

The function is called with `this === handler`, and signature 
`data, scope, context` Context and scope may be
undefined.  The emitter can be obtained from the handler. 

__return__

Nothing. 

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

This is the same form as the `events` option of `.when`. It should be an
array, namely `[event, event, ...]` where `event` is either a
string or an array of the form `[event, n, pipe, initial]`. A string is
interpreted as an event to be tracked; a number indicates how many times
to wait for. A pipe is a function that can act on the incoming data and an
initial value allows the pipe to act as a reduce. 

__example__

    t.add(["neat]");
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
