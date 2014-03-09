## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

This is an event library, but one in which events and listeners are
coordinated through a single object. The emphasis throughout is on
coordinating the global flow of the program. 

Most event libraries suggest making objects into emitters. This library is
designed to allow you to attach the object to the event/handler/emit. It
also allows you to listen for events before the corresponding object
exists. Of course, if you want to have various emitters, go for it. 

There are several noteworthy features of this library:

* When. This is the titular notion. The `.when` method allows you to
  specify an event to emit after various specified events have all fired.
  For example, if we call a database and read a file to assemble a
  webpage, then we can do something like 
  ``` emitter.when(["file
  parsed:jack", "database returned:jack"], "all data retrieved:jack"); 
  ```
  This is why the idea of a central emitter is particularly useful to this
  library's intent.
* Scope. Events can be scoped. In the above example, each of the events
  are scoped based on the user jack. It bubbles up from the most specific
  to the least specific. Each level can access the associated data at all
  levels. For example, we can store data at the specific jack event level
  while having the handler at "all data retrieved" access it. Works the
  other way too. 
* Actions. Events should be statements of fact. Actions can be used to
  call functions and are statements of doing. "Compile document" is an
  action and is a nice way to represent a function handler. "Document
  compiled" would be what might be emitted after the compilation is done.
  This is a great way to have a running log of event --> action. 
* Stuff can be attached to events, emissions, and handlers. Emits send
  data, handlers have contexts, and events have scope contexts.

Please note that no particular effort at efficiency has been made. This is
about making it easier to develop the flow of an application. If you need
something that handles large number of events quickly, this may not be the
right library. 

## Using

In the browser, include index.js. It will attach the constructor to
EventWhen in the global space. 

For node, use `npm install index.js` or, better, add it to the
package.json file with `--save` appended. 

Then require and instantiate an emitter:
```
var EventWhen = require('event-when');
emitter = new EventWhen();
```

### Method specification

These are methods on the emitter object. 

* [emit](#emit)
* [when](#when)
* [on](#on)
* [off](#off)
* [once](#once)
* [stop](#stop)
* [action](#actions)
* [scope](#scope)
* [events](#events)
* [handlers](#handlers)
* [error](#error)
* [makeLog](#log)

---
<a name="emit"></a>
### emit(str ev, obj data, str timing) --> emitter

Emit the event.  

__arguments__

* `ev`  A string that denotes the event. 
* `data` Any value. It will be passed into the handler as the first
  argument. 
* `timing` One of "now", "momentary", "soon", "later" implying emission
  first on queue, last on queue, first on next cycle, last on next cycle,
  respectively. "Momentary" is the default if not provided as that will
  preserve the order of emitting.

__return__

The emitter for chaining. The events may or may not be already emitted
depending on the timing. 

__convenience forms__ 

* `.now`  Event A emits B, B fires after the emitting handler finishes,
  but before other handler's for A finishes. This is the function calling
  model.
* `.momentary` Event A emits B, B fires after A finishes. This is more of
  a synchronous callback model. It is the same as `.emit` with the default
  setting.
* `.soon` Event A emits B then C, both with soon, then C fires after next
  tick. B fires after second tick.
* `.later` Event A emits B then C, both with later, then B fires after
  next tick. C fires after second tick.

__scope__ 

Note that if ev contains the event separator, `:` by default, then it will
be broken up into multiple events, each one being emitted. The order of
emission is from the most specific to the general (bubbling up).
`emitter.scopeSep` holds what to split on.

To stop the emitting and any bubbling, set `evObj.stop === true` in the
handler ( handler signature is `(data, evObj)` ). To do more fine-controlled
stopping, you need to manipulate `evObj.events` which is an array consisting
of objects of the form `{str scopeEvent, arr handlers}`. 

Once the event's turn on the queue occurs, the handlers for all the scopes
fire in sequence without interruption unless an `emit.now` is emitted. To
delay the handling, one needs to manipulate `evObj.emitter._queue` and
`._waiting`. Not recommended. 

__example__

    emitter.emit("text filled", someData);
    emitter.now("urgent event");
    emitter.later("whenever", otherData);
    emitter.soon("i'll wait but not too long");
    // generic:specific gets handled then generic
    emitter.emit("generic:specific");

---
<a name="when"></a>
### when(arr/str events, str ev, str timing, bool reset ) --> tracker 

This is how to do some action after several different events have all fired. Firing order is irrelevant.

__arguments__

* `events` A string or an array of strings. These represent the events that need to be fired before taking the specified action. The array could also contain a numbered event which is of the form `[event, # of times]`. This will countdown the number of times the event fires before considering it done. 
* `ev` This is the event that gets emitted after all the events have taken place. It should be an event string.
* `timing` Emits `ev` based on the timing provided, as in `.emit`.
* `reset` Setting this to true will cause this setup to be setup again once fired. The original events array is saved and restored. Default is false. This can also be changed after initialization by setting tracker.reset. 

__return__

Tracker object. This is what one can use to manipulate the sequence of events. See [Tracker type](#tracker)

__note__

If an event fires more times than is counted and later the when is reset, those extra times do not get counted. 

__example__

    emitter.when(["file read", "db returned"], "data gathered");
    emitter.emit("

---
<a name="on"></a>
### on(str ev, Handler f, obj context) --> Handler

Associates handler f with event ev for firing when ev is emitted.

__arguments__

* `ev` The event string on which to call handler f
* `f` The handler f. This can be a function, an action string, an array of
  handler types, or a handler itself.
* `context` What the this should be set to. Defaults to `null`.

__return__

The Handler which should be used in `.off` to remove the handler, if
desired. 

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

emitter for chaining. 

__example__

    // removes f from "full:event"
    emitter.off("full:event", f);
    // removes all handlers to all events with :event as last 
    emitter.off(/\:event$/);
    // removes all listed events
    emitter.off(["first", "second"], f);
    // function filter
    emitter.off(function (ev) { return (ev === "what");}, f);

---
<a name="once"></a>
### once(event, handler f, int n, obj context) --> handler h

This attaches the handler f to fire when event is emitted. But it tracks it to be removed after firing n times. Given its name, the default n is 1.

---
<a name="stop"></a>
### stop(str/bool toRemove) --> emitter

Removes events from the queue. 

---
<a name="action"></a>
### action(str name, handler, obj context) --> action handler

This allows one to associate a string with a handler for easier naming. It should be active voice to distinguish from event strings.

__arguments__

* `name` This is the action name.
* `handler` This is the handler-type object to associate with the action. 
* `context` The context to call the handler in. 

__return__

* 0 arguments. Returns the whole list of defined actions.
* 1 argument. Returns the handler associated with the action.
* 2 arguments, second null. Deletes association action.
* 2, 3 arguments. Returns created handler that is now linked to action string. 

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
* 2 arguments. Leads to the event string being returned after storing the
  object, overwriting if necessary.

---
<a name="events"></a>
### events( fun/str/reg partial, bool negate) --> arr keys

This returns a list of defined events that match the passed in partial condition. 

---
<a name="handlers"></a>
### handlers(arr events) --> obj evt:handlers

Given a list of events, such as given by event listing, produce an object with those events as keys and the values as the handlers. 

---
<a name="error"></a>
### error()

This is where errors can be dealt with when executing handlers. It is passed in the error object as well as the event, data, handler, context... If you terminate the flow by throwing an error, be sure to set `emitter._looping` to false. This is a method to be overwritten. 

---
<a name="log"></a>
### makeLog() --> fun

This creates a log function. It is a convenient form, but the log property should often be overwritten. If this is not invoked, then the log is a noop for performance/memory. 

`emitter.log` expects a description as a first argument and then whatever else varies. 

### Object Types

* [Emitter](#emitter). This module exports a single function, the constructor for this type. It is what handles managing all the events. It really should be called Dispatcher. 
* [Handler](#handler) This is the object type that interfaces between event/emits and action/functions. 
* [Tracker](#tracker) This is what tracks the status of when to fire `.when` events.

---
<a name="emitter"></a>
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
* `_queue` consists of events to be fired in this tick.
* `_waiting` is the queue for events to be fired after next tick.
* `_actions` has k:v of `action name: handler` The handler can be of type
  Handler or anything convertible to it. 
* `_scopes` has k:v of `scope name: object` When an event is emitted with
  the given scope, the object will be passed in and is accessible to any
  handler reacting to an event along the scope chain. 
* `_looping` tracks whether we are in the executing loop. 

---
<a name="handler"></a>
Handlers are the objects that respond to emitted events. Generally they wrap handler type objects. 

### Handler types

### Handler methods

---
<a name="tracker"></a>
Trackers are responsible for tracking the state of a `.when` call. It is fine to set one up and ignore it. But if you need it to be a bit more dynamic, this is what you can modify. 
### Tracker Properties

These are the instance properties

* `events` The list of currently active events/counts that are being tracked. To manipulate, use the tracker methods below.
* `ev` The action that will be taken when all events have fired. It will emit the data from all the events in the form of an array of arrays: `[[event emitted, data], ...]`
* `timing` This dictates how the action is queued. 
* `reset` This dictates whether to reset the events after firing. 
* `original` The original events for use by reset/reinitialize.
* `handler` This is the handler that fires when the monitored events fire.

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

This is the same form as the `events` option of `.when`. It can be a string or an array of [strings / array of [string, number] ]. A string is interpreted as an event to be tracked; a number indicates how many times (additional times) to wait for.

You can use this to add a number of wait times to an existing event.

<a name="tracker-remove" />
#### remove(arr/str events)

Removes event from tracking list. 

```
t.remove("neat");
t.remove(["neat", "some"]);
t.remove([["some", 4]]);
```

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