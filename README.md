##event-when

Install using `npm install event-when`

Then you can `EventWhen = require('event-when');` and use `evw = new EventWhen()` to create a new instance of this class. 

It is a node module that allows you to create object with event methods. Fairly standard stuff with the exception of the emitWhen method which resolves the problem of how to keep track of when to fire an event that has to wait for other events.  That is, it allows several events to feed into one event being emitted. 

As an example, let's say you need to read/parse a file ("file parsed") and get some data from a database ("db parsed"). Both events can happen in either order. Once both are done, then the "data is ready".

We can then implement this with  `evw.when(["file parsed", "db parsed"], "data is ready" );` 

Nifty!


### Methods

All methods return the object itself for chaining.

Each place where there is a handler, it could be a function or it could be array that mimics binding. Particularly, we could have `[that, fun, arg]`  where `that` is the `this` for the function `fun` and the `arg` is an argument object to be passed as the fourth argument of the function. The first three arguments of the function will be the data for the event, emitter, and event. The `fun` could also be a string that gets resolved (hopefully) as a method of `that`. 

* .emit(str event, [obj data], [str timing] ). Invokes all attached functions to Event, passing in the Data object, emitter object itself, and event string as the three arguments to the attached functions. The third argument in `.emit` can take arguments of
	 * "immediate" Invokes the handlers for the emit immediately, before already queued events/handlers fire. 
	 * "now" Queues the event and its current list of handlers for firing. Removing handlers to the event after the emit but before they fire will not affect the handlers that are fired. 
	 * "soon"  Queues the event and loads the handlers for firing when it is the event's turn. This is the default behavior and is reasonable. Note that if in firing this event's handlers, the handlers get removed, they will still fire. 
	 * "later" The event gets processed after nextTick/setTimeout (nodejs/browser)
* .when([fired events], str event|fun handle|arr events/handles,  [str timing], [bool reset] ) This has similar semantics as emit except the [fired events] array has a series of events that must occur (any order) before this event is emitted. The object data of each fired event is merged in with the others for the final data object -- the original is archived in the data object under `_archive`. This method stores a [tracker object](#tracker-object) in `.last` for continued manipulation of the timing of the firing. 

	 Each fired event could be an array consisting of [event, number of times, bool first]. This allows for waiting for multiple times (such as waiting until a user clicks a button 10 times to intervene with anger management).  

	 The second argument can also be directly a function that fires or an array of events and functions that get iterated over. 
	 
     The timing string gets passed to emit directly.
	 
     The reset string tells the .when to reset itself to the initial fired events array once it actually does emit. 
	 
     If the third object is a boolean, it is assumed to be the reset flag. If it is an object, it is assumed to be an options object with either timing or reset being set there.     


* .on(str event, fun handle, [obj state], [bool first])  Attaches function Handle to the string  Event. The function gets stored in the .last property; (in case of anonymous function (maybe binding in progress), this might be useful). The boolean first if present and TRUE will lead to the handle being pushed in front of the current handlers on the event. The object state, if present will bind to the handler. 
* .once(str event, fun handle, [int n, [bool first]]) This will fire the handler n times, default of 1 times. This is accomplishd by wrapping the handle in a new function that becomes the actual handler. So to remove the handle, it is necessary to grab the produced handler from `.last` and keep it around. Can manipulate the current n after initialization by accessing g.n,  where g is the returned handler found in `.last`. 
* .once(str event, fun handle, [bool first]) With no n and a boolean true, this will place the handler at the top of the firing list and fire it once when the event is emitted. 
* .off(str event, fun handle) Removes function Handle from Event. 
* .off(str event) Removes all function handlers on Event. 
* Both variants of .off above also have optional boolean that if true will prevent the removal of when handles from their tracker objects meaning those events may never fire. 
* .off()  Removes all events. Ouch. 
* .stop([str event/bool current]) Removes queued handlers either globally (no args), on an event (str given), or current (TRUE)
* .events(fun partial | str match, bool negate) It lists all events that have handlers. No arguments lead to all events being reported; if partial is a function, then it is used as a filter. If the match string is provided, then that is used to match with the negate boolean allowing a reversal of the selection for the function filter. 
* .handlers(arr events) If no arguments, it returns all events and their handlers. If there is an event listing, then it uses that list of keys to pull handlers. 

If a function handler returns FALSE, then no further handlers from that event emit incident will occur. 

Logging of single events can be done by passing an event logging function. To log all events, attach a logging function via .log = function

### Tracker Object

The .when method creates a handler that has a `handler.tracker` object and that tracker object has the following methods. This is what is stored in `.last` for easy retrieval. The handler itself is found in `tracker.handler`.

* .add(ev); .add(ev1, ev2, ...); .add([ev1, ev2, ...])  This method adds events to the array of events that should happen before firing. The event could be an array of event and number of times to fire as well as the boolean for placing it first. If an event already exists, this will increment its counter appropriately. 
* .remove(ev1, ev2, ...)  removes the event(s). Each one could be either a string or an array of `[ev, num]` specifying how many times to remove the event. 
* .cancel() This will remove the handler of the `.when` object and effectively removes this from ever being called.