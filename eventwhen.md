# [event-when](# "version: 0.4.0 | jostylr")

This is my own little event library. It has most the usual methods and conventions, more or less. 

But the one feature that it has that I am not aware of in other libraries is the ability to fire an event after other events have fired. 

As an example, let's say you need to read/parse a file and get some data from a database. Both events can happen in either order. Once both are done, then the message gets formed and sent. This is not handled well in most event libraries, as far as I know. But what if we had a method called `.emitWhen("all data retrieved", ["file parsed", "database returned"])` which is to mean to block the event "all data retrieved" until both events "file parsed" and "database returned" have fired. 

Some of the methods will return the emitter, but the ones involving handlers will return them instead. It ocurred to me that chaining of events does not seem that useful for event emitters. 

### Version 0.4.0 Thoughts

The idea is to create an action sentence that invokes the handler. So we attach the sentence to the event and then stuff happens to that. The handler can be a function or it could be an array of functions, etc. The point of invocation is when the sentence is used as a key to get the handler. So this allows dynamism which could be good, could be bad. The hard work, I think, is to rewrite the handler calling to be abstracted out to another level. I probably need to introduce an object of type handler. 

## Files

The file structure is fairly simple. 

* [index.js](#main "save:|jshint") This is the node module entry point and only relevant file. It is a small file.
* [README.md](#readme "save:| clean raw") The standard README.
* [package.json](#npm-package "save: json  | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license.

## Main

This is the main structure of the module file.

    /*global setTimeout, process, module, console */
    var EvW = _"constructor";

    _"constructor:prototype"

    var Tracker = _"tracker";

    _"tracker:prototype"

    var Handler = _"handler";

    _"handler:prototype"

    module.exports = EvW;

### Constructor

This manages an event emitter.

We use (not)private variables `_handlers` and `_queue` for the, well, handlers and queue of currently firing events. 

We bind resume to the instance since it will be passed in without context to the next function. 


    function () {
        var evw = this;

        this._handlers = {};
        this._queue = [];
        this._waiting = [];
        this._actions = {};

        evw.resume = evw.resume.bind(evw);
        evw.next.max = 1000;

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    EvW.prototype.on = _"on";
    EvW.prototype.emit = _"emit";
    EvW.prototype.off = _"off";
    EvW.prototype.stop = _"stop";
    EvW.prototype.resume = _"resume";
    EvW.prototype.when = _"emit when";
    EvW.prototype.once = _"once";

    EvW.prototype.next =  _"next";
    EvW.prototype.nextTick =  _"next tick";

    EvW.prototype.log = function () {}; //noop stub
    EvW.prototype.makeLog = _"log";
    EvW.prototype.events = _"event listing";
    EvW.prototype.handlers = _"handlers for events";
    EvW.prototype.action = _"name an action";
    EvW.prototype.makeHandler = _"handler:make";

### Emit

We have four possible timings: 

* later  This has the event emitted after at least one process.nextTick or setTimeout. When it is emitted, it uses "now".
* soon  This is the default. It pushes the event onto the queue, but it does not assign the handelrs. Thus, the event is not emitted in some sense as what responds is still indeterminate.
* now  This takes the current handlers for the event and pushes it all on the queue. 
* immediate This jump the response to the front of the queue. 

Given an event string, we run through the handlers, passing in the data to construct the array to be added to the queue. 
    
    function (ev, data,  timing) {
        var emitter = this;

        timing = timing || "soon";
        data = data || {};
        var h = this._handlers[ev] || [];

        emitter.log("emit", ev, data, timing);

        switch (timing) {
            case "later" : 
                emitter._waiting.push( [ev, data, "now"] ); 
            break;
            case "soon" : 
                emitter._queue.push([ev, data]);
            break;
            case "now" : 
                emitter._queue.push([ev, data, [].concat(h)]);
            break;
            case "immediate" : 
                emitter._queue.unshift([ev, data, [].concat(h)]);
            break;
            default : 
                if (emitter.log) {
                    emitter.log("emit error: unknown timing", ev, timing);
                }
        }
        this.resume();
    }


### Emit When

This is the key innovation. The idea is that once this is called, a handler is created that attaches to all the listed events and takes care of figuring when they have all called. 

This handler is stored in the `.last` property (until the next handler assignment). The handler exposes methods to manage the addition and removal of the events. 

As each event fires, this handler merges in the data object to the existing data. It also stores the original data object in _archive[event name] = ... in the data object passed to the event for posterity, log recordings, and hacking. 

The timing string is passed on to emit with the event `ev` finally fires. The reset flag allows for the emitWhen to be reinitialized after it fires. It uses the original state. 

If the third argument is an object, then it is considered an options object and the properties reset and timing will be checked for. 

If the third argument is a boolean, then it is assumed to be the reset string and timing will not be set, falling through to the default in emit.  


!!! Better logging dealing with str. 

    function (events, ev, timing, reset) {    

        var emitter = this, 
            options, str;    

        if (typeof ev === "string") {
            str = ev;
        } else if (ev) {
            str = ev.name || "";
        } else {
            str = "";
        }

        emitter.log(".when loaded to fire "+ str, events, timing, reset);

        if (typeof timing === "object") {
            options = timing;
            reset = options.reset || false;
            timing = options.timing || undefined;
        } else if (timing === true) {
            reset = timing; 
            timing = undefined;
        }

        var tracker = new Tracker();

        tracker.event = ev;
        tracker.emitter = emitter;
        tracker.timing = timing;
        tracker.reset = reset;
        tracker.original = events;

        var handler = function (data, emitter, fired) {
            tracker.addData(data, fired); 
            tracker.remove(fired);
            return true;
        };


        handler.tracker = tracker;

        tracker.handler = handler; 

        tracker.add(events);

We return the tracker since one should use that to remove it. If you want the handler itself, it is in tracker.handler. It just seems more natural this way since the manipulations use tracker. 

        return tracker;
    }



#### Tracker 

The tracker object is used to track all the data and what events are available. Controlling it controls the queue of the when emit. 

    function () {
        this.events = {};
        this.data = {_archive : {} };

        return this;
    }


[prototype](# "js")

THe various prototype methods for the tracker object. 

    Tracker.prototype.add = _"tracker:add";
    Tracker.prototype.remove = _"tracker:remove";
    Tracker.prototype.removeStr = _"tracker:remove string";
    Tracker.prototype.go = _"tracker:go";
    Tracker.prototype.addData = _"tracker:add data";
    Tracker.prototype.cancel = _"tracker:cancel";


[add](# "js") 

We can add events on to the tracker. We allow it to be an array of events passed in or a bunch of strings passed in as parameters.

    function (args) {
        var tracker = this,
            archive = tracker.data._archive,
            events = tracker.events,
            handle = tracker.handler;

        if (arguments.length !== 1) {
            args = [].concat(arguments);
        } else if (typeof args === "string") {
            args = [args];
        }


        args.forEach(function (el) {
            var num, str, order;
            if (typeof el === "string") {
                str = el;
                num = 1;
                order = false;
            }
            if (Array.isArray(el) ) {
                if ((typeof el[1] === "number") && (el[1] >= 1) && (typeof el[0] === "string") ) {
                    num = Math.round(el[1]);
                    str = el[0];
                    order = el[2] || false;
                } 
            }
            if (str && (typeof num === "number") ) {
                if (events.hasOwnProperty(str) ) {
                    events[str] += num;
                } else {
                    tracker.emitter.on(str, handle, order);
                    if (! (archive.hasOwnProperty(str) ) ) {
                        tracker.data._archive[str] = [];
                    }
                    events[str] = num;
                }
            }
        });
    }


[remove](# "js")  

We can remove the events.

Note the `true` for the .off command is to make sure the `.remove` is not called again. Rather important. 

    function () {
        var tracker = this,
            args = Array.prototype.slice.call(arguments, 0),
            events = tracker.events;



        args.forEach(function (el) {
            var num, str;
            if (typeof el === "string") {
                str = el;
                num = 1;
            }
            if (Array.isArray(el) ) {
                if ((typeof el[1] === "number") && (el[1] >= 1) && (typeof el[0] === "string") ) {
                    num = Math.round(el[1]);
                    str = el[0];
                } 
            }
            if (str && num) {
                if (events.hasOwnProperty(str) ) {
                    events[str] -= num;             
                    if (events[str] <= 0) {
                        delete events[str];
                        tracker.emitter.off(str, tracker.handler, true);
                    }
                } 
            } 
        });
        tracker.go();
    }
    
[remove string](# "js")

This is mainly for use with the `.off` method where the handler has already been removed from the event. This takes in just a string and removes the event entirely from the events object. It then runs `go` to see if emit time is ready.

    function (ev) {
        var tracker = this;

        delete tracker.events[ev];

        tracker.go();
    }

[add data](# "js")

When an event fires, that data gets merged in with all previous data for the emitWhen. We also keep a record of it in the `_archive` of the  data object. 


    function (eventData, event) {
        var tracker = this,
            data = tracker.data,
            key;

        for (key in eventData) {
            data[key] = eventData[key];
        }

        data._archive[event].push(eventData);

    }


[cancel](# "js")

This cancels the emitWhen, removing the handler from all remaining events. 

    function () {
        var tracker = this, 
            emitter = tracker.emitter,
            handler = tracker.handler,
            event, keys;
        
        keys = Object.keys(tracker.events);

        for (event in keys) {
            emitter.off(event, handler);
        }

    }

[go](# "js")

This is the primary activator. 

If reset is true, then we add those events before firing off the next round. 

We might have an event, a handle, or an array of such things. The array could also hold an array of the array handler type. 

    function () {
        var tracker = this, 
            ev = tracker.event, 
            data = tracker.data,
            events = tracker.events,
            timing = tracker.timing;


        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
            _":go event handle" else if (Array.isArray(ev) ) {
                ev.forEach(function (ev) {
                    _":go event handle" else if (Array.isArray(ev)) {
                        _":go array handle"
                    } else {
                        _":go error"
                    }
                });
            }
        }

        return true;
    }

[go event handle](# "js") 

So either we emit an event or we call a handler

            if (typeof ev === "string") {
                tracker.emitter.emit(ev, data, timing);
            } else if (typeof ev === "function") {
                ev(_":arg list");
            }

[go array handle](# "js")

Array handle

    if (typeof ev[1] === "function") {
        ev[1].call(ev[0], _":arg list", ev[2]);
    } else if (ev[0].hasOwnProperty(ev[1]) && typeof (ev[0][ev[1]] === "function") ) {
        ev[0][ev[1]](_":arg list", ev[2]);
    } else {
        _":go error"
    }


[arg list](# "js") 

    data, tracker.emitter, "emitWhen handler called"

[go error](# "js")

    tracker.emitter.log("emitWhen handle failed to be fired", ev, data);


### On

It takes an event (a string) and a Handler or something that converts to a Handler.  To have segments that are always in order, use a Handler with an array value of handler-types that will be executed in order.


"first" should be rarely used hence last. Pass TRUE in that slot; if that and args are not needed, pass in null. 


    function (ev, f, that, args, first) {
        var emitter = this,
            hand;



        var handlers = this._handlers;

        hand = new Handler(f, ev, that, args); 

        if (handlers.hasOwnProperty(ev)) {
            if (first === true) {
                handlers[ev].unshift(f);
            } else {
                handlers[ev].push(f);
            }
        } else {
            handlers[ev] = [f];
        }

        return f;

    }

### Handler

This is where we define handlers. It seems appropriate to sandwich them between on and off. 

The idea is that we will encapsulate all handlers into a handler object. When a function or something else is passed into .on and the others, it will be converted into a handler object and that object gets returned. If a handler object is passed in, then it gets attached. It will record which events it is attached to and one can use it to remove itself from any or all events that it is attached to. 

This is a constructor and it should return `this` if it is creating or the value if it is already an instance.

    function (value, ev, that, args) {
        if (value instanceof Handler) {
            value.add(ev);
            return value;
        }
        var handler = this;
        if (Array.isArray) {
            handler.value = value;
        } else {
            handler.value = [value];
        }
        handler.events = {};
        if (that) {
            handler.that = that;
        } 
        if (typeof args !== undefined) {
            handler.args = args;
        }
        handler.add(ev);
        return this;
    }

[prototype](# "js")

The prototype object

    Handler.prototype.add = _":add";
    Handler.prototype.remove = _":remove";
    Handler.prototype.name = _":name";
    Handler.execute = _":execute";

[add](# "js")

Adding an event to the list. We are assuming a handler object is strongly associated with an emitter and not being used for multiple ones; note a function could be used multiple emitters, just not the encapsulating handler.

    function (ev) {
        var handler = this;
        if (handler.events.hasOwnProperty(ev) ) {
            handler.events[ev] += 1;
        } else {
            handler.events[ev] = 1;
        }
    } 

[remove](# "js")

Removing an event from the handler.

    function (ev) {
        var handler = this;
        if (handler.events.hasOwnProperty(ev) ) {
            handler.events[ev] += 1;
            if (handler.events[ev] < 1) {
                delete handler.events[ev];
            }
        }
    }

[name](# "js")

We can add a name to it or report its name.

    function (name) {
        if (name) {
            this.name = name;
        } else {
            return (this.name || "");
        }
    }


[execute](# "js")

Here we can execute a handler this. This is the whole point. We could have a variety of values here.

* string. This could be an action, in which case it is . Or it could be an event which case it is emitted, the data going along for the ride. 
* function. Classic. It gets executed. no given context
* handler. This is an object of type handler. It allows us to stash stuff in the object. 
* [possible handler types...]. The array form gets executed in order. The array can contain Handler objects that are then handled 

We have a cont value that if false will terminate execution of further handlers.

That and args are mainly for passing in when calling a handler from a handler. If a handler already has these bound, it will use the bound ones. 


    function (data, emitter, ev, that, args) {
        var handler = this,
            value = handler.value,
            i, n = value.length, 
            verb, vtype, 
            cont = true;
        that = handler.that || that || null, 
        args = handler.args || args || null;

        if (emitter.countExecute > emitter.maxExecute) {
            emitter.log("Exceeded max execute limit in one call", ev);
            return false;
        } else {
            emitter.countExecute += 1;
        }

        for (i = 0; i <n; i += 1) {
            verb = value[i];
            vtype = typeof verb;
            if (vtype === "string") {
                _":string verb"
            } else if (vtype === "function") {
                cont = verb.call(that, data, emitter, ev, args);
            } else if (verb instanceof Handler) {
                cont = verb.execute(data, emitter, ev, that, args);
            }
            if (cont === false) {
                return cont;
            }
        }

        return cont;
    }

[string verb](# "js")

The verb could be either an action, if it matches, or it is treated as an event to emit which allows one to pass in a timing event. It 

An action is an instanceof Handler. So we call its execute method. Hope it is not self-referential...but if it is is the countExecute variable should stop infinity in its tracks.

    if (emitter.actions.hasOwnProperty(verb) ) {
        emitter.log("calling action" + verb + " for event " + ev);
        cont = emitter.actions[verb].execute(data, emitter, ev, that, args);
    } else if (emitter._handlers.hasOwnProperty(verb) ) {
        emitter.log("emitting " + verb + " for event " + ev);
        emitter.emit(verb, data, handler.timing[verb]);
    }


### Off

This removes handlers. The nowhen boolean, when true, will leave the when handlers on the when events. This effectively blocks those events from happening until some manual reworking on the event. Since the no argument function wipes out all handlers, period, we do not need to worry here. 

    function (ev, fun, nowhen) {

        var emitter = this;

        var handlers = emitter._handlers;
        var h, f;


        if (arguments.length === 0) {
            emitter._handlers = {};
            emitter.log("all handlers removed");
            return emitter;
        }

        if (!handlers.hasOwnProperty(ev) ) {
            emitter.log("no event found to remove handlers", ev);
            return emitter;
        }

        if () {
            _":remove handler"
            emitter.log("handler for event removed " + ev + fun.name);
            _":is event empty"
            return emitter;
        }

        // easy case -- check for equality of reference
        if (fun instanceof Handler) {
            _":remove Handler"
            emitter.log("handler for event removed" +  ev + " :: " + fun.name() );
            return emitter;
        }

        // harder -- check for handler whose value is one of these
        if (typeof fun === "function" || Array.isArray(fun) ||  typeof fun === "string") {
            _":find and remove handler with matching value"
            emitter.log("handler for event removed" +  ev);            
            return emitter;
        }


        if (typeof fun === "boolean") {
            nowhen = fun;
        }

        if (nowhen === true) {
            delete handlers[ev];
            emitter.log("removed handlers on event, leaving on when", ev); 
            return emitter;
        } else {
            _":remove handlers checking for when handlers"
            emitter.log("removing handles on event", ev);
        }            
        
        return emitter;
    }


[is event empty](# "js")

After removing handlers, check if there is any left. If not, remove event. This allows one to check to see if there handlers that are not removed. 

    if (handlers[ev].length === 0) {
        emitter.log("event " + ev+ " removed as no handlers left"); 
        delete handlers[ev];
    }            


[remove handler](# "js")

This will remove all duplicate handlers of the passed in function as well.

    handlers[ev] = handlers[ev].filter(function (el) {
        if (el === fun) {
            return false;
        } else {
            return true;
        }
    }); 
    if ( (nowhen !== true) && fun.hasOwnProperty("tracker") )  {
        fun.tracker.removeStr(ev);
    }


[remove array handler](# "js")

This will remove all remove all duplicates, but the handler is defined by obj, function, args. All must be the same as the original object (in reference, not value). 

    handlers[ev] = handlers[ev].filter(function (el) {
        if (Array.isArray(el)) {
            if ( (el[0] === fun[0]) && (el[1] === fun[1]) && (el[2] === fun[2]) ) {
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }); 


[remove handlers checking for when handlers](# "js")

    
    h = handlers[ev];
    while (h.length > 0) {
        f = h.pop();
        if (f.hasOwnProperty("tracker") ) {
            f.tracker.removeStr(ev);
        }
    }
    delete handlers[ev];



### Once

This method produces a wrapper around a provided function that automatically removes the handler after a certain number of event firings (once is default). The new handler is what is returned.

The way it works is the f is put into a handler object. This handler object then has a function placed as the first to be invoked. When invoked, it will decrement the number of times and remove the handler if it is less than or equal to 0. That's it. No function wrapping in a function.

    function (ev, f, n, that, args, first) {
        var emitter = this, 
            g;

        f = new Handler(f, ev, that, args);

        f.n = n || 1;

        g = function() {
            f.n -=1;
            if (f.n <== 0) {
                emitter.off(ev, f);
            }
        }

        f.value.shift(g);

        emitter.on(ev, f, first); 

        emitter.log("assigned event times", ev + " :: " + n);

        return f;
    }

### Stop

Clear queued up events. Each element of the queue is an array of the [event name, data, [ handler,  ... ]]

* No args removes all events
* string arg  removes the event string
* true arg  removes the next element. 

---

    function (a) {
        var queue = this._queue;
        var waiting = this._waiting; 
        var emitter = this;
        var ev; 

        if (arguments.length === 0) {
            while (queue.length > 0 ) {
                queue.pop();
            }
            while (waiting.length >0 ) {
                waiting.pop();
            }
            emitter.log("queue cleared of all events");
            return emitter; 
        }

        if (a === true) {
            ev = queue.shift();
            emitter.log("event cleared", ev[0] );
            return emitter;
        }

        var filt = function (el) {
            if (el[0] === a) {
                return false;
            } else {
                return true;
            }
        };

        if (typeof a === "string") {
            emitter._queue = queue.filter(filt);
            emitter._waiting = waiting.filter(filt);
            emitter.log("all instances of event cleared", a);
        }

        return emitter;
    }

### Resume

This continues progress through the queue. We use either setTimeout (browser) or nextTick (node) to allow for other stuff to happen in between each 1000 calls.

As this is called without context, we return the resume function with an explicit binding to the instance instead of this. 

To handle "soon", we check to see if the current queue item has anything in the handler queue. If not, it loads it. 

     function () {

        var q, f, ev, data, cont, cur,  
            emitter = this,
            queue = emitter._queue,
            handlers = emitter._handlers,
            waiting = emitter._waiting; 

        emitter.log("events on queue", queue.length+waiting.length, queue, waiting);
        emitter.countExecute = 0;

        if (queue.length >0) {
            cur = queue[0];
            ev = cur[0];
            data = cur[1];
            if (typeof cur[2] === "undefined") {
               cur[2] = Array.prototype.slice.call(handlers[ev] || [], 0);
            }
            q = cur[2];
            f = q.shift();
            if (q.length === 0) {
                queue.shift();
            }
            if (f) {
                _":deal with handler calling"
            }
            this.next(this.resume);
        } else if (waiting.length > 0) {
            emitter.nextTick(function () {
                emitter.emit(ev, data, "now");
            });
        } else {
            emitter.log("emitted events cleared");
        }

    }

[deal with handler calling](js "#")

We need to implement plain function calling or callbacks with global, function, initial arguments. 

    if (typeof f === "function") {
        emitter.log("handler firing", (f.name || "") + " for "+ ev, data);
        cont = f(data, emitter, ev);
    } else if (Array.isArray(f)) {
        emitter.log("handler firing", (f.name || "") + " for " + ev, data);
        if (typeof f[1] === "function") {
            cont = f[1].call(f[0], data, emitter, ev, f[2]);
        } else if (f[0].hasOwnProperty(f[1]) && (typeof f[0][f[1]] === "function") ) {
            cont = f[0][f[1]](data, emitter, ev, f[2]);
        } else {
            _":warning failed handler"
        }            
    } else {
            _":warning failed handler"
    }
        
    _":do we halt event emission"


[do we halt event emission](# "js")

If f returns false, this is supposed to tell us to stop. So we shift the queue meaning on the next round it will be something different. But if f was the last one, then we already shifted and so we just do a quick check to make sure that we are removing the right emitted event. 

    if ( (cont === false) && (cur === queue[0]) ) {
        queue.shift(); 
    }

[warning failed handler](# "js")

We return `cont = true` to continue the handling.

    emitter.log("warning: handler not understood", ev + f, data);
    cont = true;



### Next

This checks for whether there is stuff left on the queue and whether it is time to cede control (emitter.next.max )

    function (f) {
        var emitter = this,
            next = emitter.next,  // this is itself
            queue = emitter._queue;


        next.count += 1;

        if (queue.length > 0) {
            if (next.count <= next.max) {
                f(); 
            } else {
                next.count = 0;
                emitter.nextTick(f);
            }
        } else {
            next.count = 0;
        }

    }


### Next Tick

The cede control function -- node vs browser.

    (typeof process !== "undefined" && process.nextTick) ? process.nextTick 
        : (function (f) {setTimeout(f, 0);})
    

### Name an action

The idea is to create a handler-type object (whatever could be in a handler spot) that is listed under an action name. An action object actually is a function whose handler part is under the handler key and is prototyped with a few methods. 


The lock value indicates whether we can overwrite the function. The default is yes we can (but don't do that). Nothing prevents `delete emitter._actions[name]`

    function (name, handler, lock) {
        var emitter = this;

        emitter._actions[handler] = function () {

        }
    }

### Event listing

This allows us to see what events have handlers and the number of handlers they have. 

We can pass in a function as first argument that should return true/false when fed an event string to indicate include/exclude. Alternatively, we can pass in a string that will be used as a regex to determine that. Given a string, we can include a negate boolean which will negate the match semantics. 

If nothing is passed in, then we return all the events that have handlers.

    function (partial, negate) {
        var emitter = this, 
            handlers = emitter._handlers,
            keys = Object.keys(handlers), 
            regex; 

        if (typeof partial === "function") {
            return keys.filter(partial);
        } else if (typeof partial === "string") {
            regex = new RegExp(partial);
            if (negate !== true) {
                return keys.filter(function (el) {
                    if (regex.test(el)) {
                        return true;
                    } else {
                        return false;
                    }
                });
            } else {
                return keys.filter(function (el) {
                    if (regex.test(el)) {
                        return false;
                    } else {
                        return true;
                    }
                });
            }
        } else {
            return keys;
        }

    }

### Handlers for events

Given a list of events, such as given by event listing, produce an object with those events as keys and the values as the handlers. 

    function (events) {
        if (!events) {
            events = this.events();
        }
        var emitter = this, 
            handlers = emitter._handlers, 
            i, n=events.length, event, 
            ret = {}; 


        for (i= 0; i < n; i +=1) {
            event = events[i];
            if ( handlers.hasOwnProperty(event) ) {
                ret[event] = handlers[event].slice();
            }
        }

        return ret;

    }


###  Log

This is a sample log function that could be used. To use it, simply set the instance's property log to `this.makeLog()` which generates a log function with its own log data. This will prevent garbage collection so profile it if using this with a large event system. 

Logs everything, storing the result in the function itself under the name log. To print out, use .print(description) for those whose leading string is description or just .print() for full results.

    function () {
        var emitter = this;
        var log = {
            _full : [],
            _simple : []
        };
        var pass = function () {
            return Array.prototype.slice.call(arguments, 0);
        };
        var ret = function (description, specific) {
            var f; 
            log._full.push(Array.prototype.slice.call(arguments, 0));
            log._simple.push(description+":" + (specific || ""));
            if (ret.hasOwnProperty(description) ) {
                f = ret.description;
            } else {
                f = pass;
            }
            if (log.hasOwnProperty(description) ) {
                log[description].push(f(arguments));
            } else {
                log[description] = [f(arguments)];
            }
        };
        ret.data = log; 
        ret.print = function (description) {
            if (description) {
                console.log(log[description]);
            } else {
                console.log(log._simple);
            }
        };
        ret.full = function () {
            console.log(log._full);    
        };
        ret.filter = function (f) {
            console.log(log._simple.filter(f));
        };
        emitter.log = ret; 
        return ret;
    }

## README

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


## TODO

do an example of logs and get the log stuff strewn in. 

## NPM package

The requisite npm package file. 

[](# "json") 

    {
      "name": "DOCNAME",
      "description": "An event library that allows for the blocking of event firing thus dealing with many-to-one event firing",
      "version": "DOCVERSION",
      "homepage": "https://github.com/GHUSER/DOCNAME",
      "author": {
        "name": "James Taylor",
        "email": "GHUSER@gmail.com"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/GHUSER/DOCNAME.git"
      },
      "bugs": {
        "url": "https://github.com/GHUSER/DOCNAME/issues"
      },
      "licenses": [
        {
          "type": "MIT",
          "url": "https://github.com/GHUSER/DOCNAME/blob/master/LICENSE-MIT"
        }
      ],
      "main": "index.js",
      "engines": {
        "node": ">0.6"
      },
      "dependencies":{
      },
      "keywords": ["event"],
      "preferGlobal": "false"
    }



## LICENSE MIT


The MIT License (MIT)
Copyright (c) 2013 James Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
