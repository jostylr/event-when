##event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

NOTE: Major rewrite in progress. The readme here refers to the current npm version, not to this repository. See newReadme for what's cooking. 

Install using `npm install event-when`

Then you can `EventWhen = require('event-when');` and use `evw = new EventWhen()` to create a new instance of this class. 

It is a node module that allows you to create object with event methods. Fairly standard stuff with the exception of the `.when` method which resolves the problem of how to keep track of when to fire an event that has to wait for other events.  That is, it allows several events to feed into one event being emitted. 

As an example, let's say you need to read/parse a file ("file parsed") and get some data from a database ("db parsed"). Both events can happen in either order. Once both are done, then the "data is ready".

We can implement this with  `evw.when(["file parsed", "db parsed"], "data is ready" );` 

Nifty!


### Methods

The simplest example of a handler is a function, but it could also be an action name, event string to be emitted, a Handler object, or an array of such things that could also contain arrays of the form `[that, fun, arg]` where `that` is the context, `fun` is the function to fire, and `arg` is some data to be passed into the third argument of `fun`. The first two arguments of `fun` are the data for the event and the emitter itself; there is a fourth argument that is the event string itself (which is surprisingly useful at times).

* .emit(str event, [obj data] ). Invokes all attached functions to Event, passing in the Data object, emitter object itself, and event string as the three arguments to the attached functions. 
* .later(str event, [obj data], [bool first] ).  Queues the event for emitting on next tick (or so). If first is true, then it puts the event ahead of others in line for emitting. Other than timing, same as .emit.
* .when([fired events], Handler,  options ) This has similar semantics as emit except the [fired events] array has a series of events that must occur (any order) before this event is emitted. The object data of each fired event is merged in with the others for the final data object -- the original is archived in the data object under `_archive`. This method returns a [tracker object](#tracker-object).

    Each fired event could be an array consisting of [event, number of times, bool first]. This allows for waiting for multiple times (such as waiting until a user clicks a button 10 times to intervene with anger management).  

    The second argument can be any [Handler-type](#handler-object). 
        
    The options argument has the following useful keys: 

    * that Will be the context for functions fired from ev
    * args Will be the arguments passed to such functions
    * timing Is the timing passed to emitting events. later and firstLater togger .later and .later(...true),  respectively. No timing or anything else triggers .emit
    * reset Should the .when parameters be reset to the initial state once fired?

* .on(str event, Handler--convertible, obj that, ? args, boolean first)  Attaches a Handler object to the string  Event. The Handler is returned. Anything convertible to a Handler can be in the second slot. The Handler will be called in the context of `that` with `args` passed in as one of the arguments if those are present. The boolean first if present and TRUE will lead to the handle being pushed in front of the current handlers on the event. 
* .once(str event, fun handle, int n, obj that, ? args, bool first) This will fire the handler n times, default of 1 times. This is accomplishd by placing a counting function as the first function to execute; it removes the handler when it reaches 0, but it still executes. The post-n arguments are the same as in `.on`. Warning: If you passin a Handler from somewhere else, it will add the counting function to it which means it will decrement if something else calls it. You can always wrap a Handler in an array to avoid this. 
* .off(str event, fun handle) Removes function Handle from Event. The handler can be of type handler or a function, string, etc. If it is not a Handler, then it will only remove it if the Handler's value matches what is passed in, e.g., if you pass in function f then only if value matches [f] and not [f, g]. 
* .off(str event) Removes all function handlers on Event. 
* Both variants of .off above also have optional boolean that if true will prevent the removal of when handles from their tracker objects meaning those events may never fire. 
* .off()  Removes all events. Ouch. 
* .stop([str event/bool current]) Removes queued handlers either globally (no args), on an event (str given), or current (TRUE)
* .events(fun partial | str match, bool negate) It lists all events that have handlers. No arguments lead to all events being reported; if partial is a function, then it is used as a filter. If the match string is provided, then that is used to match with the negate boolean allowing a reversal of the selection for the function filter. 
* .handlers(arr events) If no arguments, it returns all events and their handlers. If there is an event listing, then it uses that list of keys to pull handlers. 
* .action(str name, handler, that, args) This stores a reference to a Handler in the action list. It can be invoked by simply using the name instead of the handler in any place where Handlers are accepted. 

If a function handler returns FALSE, then no further handlers from that event emit incident will occur. 

Logging of single events can be done by passing an event logging function. To log all events, attach a logging function via .log = function

### Tracker Object

The .when method creates a handler that has a `handler.tracker` object and that tracker object has the following methods. This is what is returned from that method. The handler itself is found in `tracker.handler`.

* .add(ev); .add(ev1, ev2, ...); .add([ev1, ev2, ...])  This method adds events to the array of events that should happen before firing. The event could be an array of event and number of times to fire as well as the boolean for placing it first. If an event already exists, this will increment its counter appropriately. 
* .remove(ev1, ev2, ...)  removes the event(s). Each one could be either a string or an array of `[ev, num]` specifying how many times to remove the event. 
* .cancel() This will remove the handler of the `.when` object and effectively removes this from ever being called. 

So concludes Trackers.

### Handler Object

The Handler type is what encapsulates what is being called. The handles to be exceuted are storedin an array property called `.value`. It may have a `.name` property (generated for actions, at the least),  `.that` for the context the functions are called in, `.args` for a pass-in data into the function. 

The prototype has the method `.execute` which is internal and is what is called to execute the handlers. 

You can pass in functions, strings, arrays of these things, arrays with an array [context, function, args], and Handlers themselves.  

### .Error

Since we are controlling the flow, we can also control error throwing. So that is what the emitter.error method does. All calls to handlers have their errors caught and sent to the .error method. The default is to throw the error again with the event string and handler name added to the error.