##event-when

Install using `npm install event-when`

Then you can `EventWhen = require('event-when');` and use `evw = new EventWhen()` to create a new instance of this class. 

It is a node module that allows you to create object with event methods. Fairly standard stuff with the exception of the emitWhen method which resolves the problem of how to keep track of when to fire an event that has to wait for other events.  That is, it allows several events to feed into one event being emitted. 

As an example, let's say you need to read/parse a file ("file parsed") and get some data from a database ("db parsed"). Both events can happen in either order. Once both are done, then the "data is ready".

We can then implement this with  `evw.emitWhen("data is ready", ["file parsed", "db parsed"]);`


### Methods

All methods return the object itself for chaining.

* .emit(str event, [obj data], [bool immediate] ). Invokes all attached functions to Event, passing in the Data object as the only argument to the attached functions. If third argument is a boolean and is TRUE, then the event is acted on immediately. Otherwise the event is invoked after current queue is cleared.
.emitWhen(str event, [fired events], [bool immediate] ) This has the same semantics as emit except the [fired events] array has a series of events that must occur (any order) before this event is emitted. The object data of each fired event is merged in with the others for the final data object.
* .on(str event, fun handle, [bool first])  Attaches function Handle to the string  Event. The function gets stored in the .last property; (in case of anonymous function (maybe binding in progress), this might be useful). The boolean first if present and TRUE will lead to the handle being pushed in front of the current handlers on the event. 
* .off(str event, fun handle) Removes function Handle from Event. 
* .off(str event) Removes all function handlers on Event. 
* .off()  Removes all events. Ouch. 
* .stop([str event/bool current]) Removes queued handlers either globally (no args), on an event (str given), or current (TRUE)

If a function handler returns FALSE, then event invoking stops on the handler. 

Logging of single events can be done by passing an event logging function. To log all events, attach a logging function via .log = function

Events will be converted to all lower case on lookup.