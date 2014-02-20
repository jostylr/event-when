# [event-when](# "version: 0.6.0-pre| jostylr")

This is an event library that emphasizes flow-control from a single dispatch object. 

## Introduction

This provides a succinct introduction to the library for the readme and this file.

[doc]()

    This is an event library, but one in which events and listeners are coordinated through a single object. The emphasis throughout is on coordinating the global flow of the program. 

    If you wish to attach event emitters to lots of objects, such as buttons, this is library is probably not that useful. 

    Instead, you attach the buttons to the events and/or handlers. 

    There are several noteworthy features of this library:

    * When. This is the titular notion. The `.when` method allows you to specify actions to take when various specified events have all fired. For example, if we call a database and read a file to assemble a webpage, then we can do something like `emitter.when(["file parsed:jack.txt", "database returned:jack"], "all data retrieved:jack");
    * Scope. Events can be scoped. In the above example, each of the events are scoped based on the user jack. It bubbles up from the most specific to the least specific. Each level can access the associated data at all levels. For example, we can store data at the specific jack event level while having the handler at "all data retrieved" access it. Works the other way too.
    * Actions. Events should be statements of fact. Actions can be used to call functions and are statements of doing. "Compile document" is an action and is a nice way to represent a function handler. "Document compiled" would be what might be emitted after the compilation is done. This is a great way to have a running log of event --> action. 
    * Stuff can be attached to events, emissions, and handlers. The convention is that the first bit is `data` and should be JSONable. The second bit is `myth` and can be functions and complicated "global" state objects not really intended for inspection. I find separating the two helps debugging greatly. 

    Please note that no effort at efficiency has been made. This is about making it easier to develop the flow of an application. If you need something that handles large number of events quickly, this may not be the right library. 

## Files

The file structure is fairly simple. 

* [index.js](#main "save:|jshint") This is the node module entry point and only relevant file. It is a small file.
* [ghpages/index.js](#main "save:|jshint") This is for browser access. 
* [examples/full.js](#full-example "save: |jshint")
* [README.md](#old-readme "save: |clean raw ") The standard README.
* [newREADME.md](#readme "save: ") The standard README, new version.
* [package.json](#npm-package "save: json  | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license.
* [.travis.yml](#travis "save:") A .travis.yml file for [Travis CI](https://travis-ci.org/)
* [.gitignore](#gitignore "Save:") A .gitignore file
* [.npmignore](#npmignore "Save:") A .npmignore file

For development, you can use the bundled literate-programming easily by using `npm run-script compile`

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

We use (not)private variables:

* `_handlers` has key:value of `event:[handler1, handler2,..]` and will fire them in that order. 
* `_queue` consists of events to be fired in this tick.
* `_waiting` is the queue for events to be fired after next tick.
* `_actions` has k:v of `action name: handler` The handler can be of type Handler or anything convertible to it. 
*`_scopes` has k:v of `scope name: object` When an event is emitted with the given scope, the object will be passed in and only events scoped to that scope will fire. 
* `scopeSep` is the scope separator in the event parsing. The default is `:`. We can have multiple levels; the top level is the global event. 
* `count` tracks the number of events emitted. 

We bind resume to the instance since it will be passed in without context to the next function. 
    function () {

        this._handlers = {};
        this._queue = [];
        this._waiting = [];
        this._actions = {};
        this._scopes = {};
        this.scopeSep = ":";
        this.counters = {
            execute : 0,
            executeMax: 1000,
            resume : 0,
            resumeMax :Infinity,
            loop : 0,
            loopMax: 100,
            emit : 0
        };
        this.name = "";
        this.timing = "now";

        this.resume = this.resume.bind(this);

        this.on("when handler events called", _"tracker:when handler");

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    EvW.prototype.on = _"on";
    EvW.prototype.emit = _"emit";
    EvW.prototype.eventLoader = _"event loader";
    EvW.prototype.now = _"emit:convenience method| substitute(TIMING, now)";
    EvW.prototype.momentary = _"emit:convenience method| substitute(TIMING, momentary)";
    EvW.prototype.soon = _"emit:convenience method| substitute(TIMING, soon)";
    EvW.prototype.later = _"emit:convenience method| substitute(TIMING, later)";
    EvW.prototype.off = _"off";
    EvW.prototype.stop = _"stop";
    EvW.prototype.resume = _"resume";
    EvW.prototype.when = _"when";
    EvW.prototype.once = _"once";

    EvW.prototype.nextTick =  _"next tick";

    EvW.prototype.log = function () {}; //noop stub
    EvW.prototype.makeLog = _"log";
    EvW.prototype.events = _"event listing";
    EvW.prototype.handlers = _"handlers for events";
    EvW.prototype.action = _"name an action";
    EvW.prototype.scope = _"name a scope";
    EvW.prototype.makeHandler = _"handler:make";
    EvW.prototype.error = _"error handling";

### Emit

This function is the core of both emit and later. 

First it gets an array of the various scope level events and loads their context objects. We create the event object which holds all relevant bits for this event call. 


    function (ev, data, myth, timing) {
        var emitter = this, 
            sep = emitter.scopeSep,
            counters = emitter.counters;

        timing = timing ||emitter.timing || "now";

        emitter.log("emit", ev, data, myth, timing);

        var scopes = ev.split(sep);

        counters.emit += 1;

        var scopeData = {}, 
            scopeMyth = {}; 

        var lev = "";
        scopes = scopes.map(function (el) {
            var dm;
            lev += (lev ? sep + el : el);
            dm = emitter.scope(lev);
            scopeData[lev] = dm.data;
            scopeMyth[lev] = dm.myth;
            return lev;
        });

        var evObj = {
            ev : ev,
            emitData : data,
            emitMyth : myth,
            scopes : scopes, 
            scopeData : scopeData,
            scopeMyth : scopeMyth,
            count : counters.emit,
            type : type
        };

        var events = evObj.events = [];

        scopes.forEach(function (el) {
           var h = emitter._handlers[el];
           if (h) {
                //shifting does the bubbling up
               events.shift({scopeEvent: el, handlers: h.slice()});
           }
        }); 

        emitter.loadEvent(type, evObj);

        this.resume();

        return emitter;
    }


[doc]() 

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

        _":example"

[example]()

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

[convenience method]()

This makes the now, later, ... methods. TIMING gets replaced with the timing. That's it!

    function (ev, data, myth) {
        var emitter = this;
        emitter.emit(ev, data, myth, "TIMING");
        return emitter;
    }


### Event Loader

This loads the event object in the appropriate queue. 

    function (type, evObj) {
        var emitter = this;

        switch (type) {
            case "now" :
                emitter._queue.unshift(evObj);
            break;
            case "later" :
                emitter._waiting.push(evObj);
            break;
            case "soon" : 
                emitter._waiting.unshift(evObj);
            break;
            case "momentary" :
                emitter._queue.push(evObj);
            break;
            default : 
                emitter._queue.unshift(evObj);
        }
    }


### When

This is a key innovation. The idea is that once this is called, a handler is created that attaches to all the listed events and takes care of figuring when they have all called. 

When all the events have fired, then the given event emits with a data/myth object that are arrays of all the fired event's data/myths. 

The return is the tracker which contains all things that might need to be accessed. It also contains the remove methods to cancel the `.when`.

It has the argument of timing used to time the emitting of the event to be fired. The argument reset allows for reseting to the initial state once fired. 

Emitting scoped events will count as a firing of the parent event, e.g., `.when([["button", 3], "disable")` will have `.emit("button:submit")` remove one of the button counts (unless event bubbling is stopped). But `.emit("button")` will not count for any `.when("button:submit")`. 


    function (events, ev, timing, reset) {    

        var emitter = this;

        emitter.log(".when loaded", events, ev, timing, reset);

        var tracker = new Tracker ();

        tracker.emitter = emitter;
        tracker.ev = ev;
        var data = tracker.data = [];
        var myth = tracker.myth [];
        tracker.timing = timing || emitter.timing || "now";
        tracker.reset = reset || false;
        tracker.original = events.slice();


        var handler = new Handler (function (data, passin) {
            var ev = passin.ev;
            data.push([ev, data]);
            myth.push([ev, passin.myth.emit]);
            tracker.remove(ev);
        });


        handler.tracker = tracker;

        tracker.handler = handler; 

        tracker.add(events);

We return the tracker since one should use that to remove it. If you want the handler itself, it is in tracker.handler. It just seems more natural this way since the manipulations use tracker. 

        return tracker;
    }

[doc]()

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

        _":example"

[example]()

    //have two events trigger the calling of action compile page
    emitter.when(["file read:dog.txt", "db returned:Kat"], "data gathered");
    //have two events trigger the emitting of all data retrieved
    emitter.when(["file read:dog.txt", "db returned:Kat"], "all data retrieved:dog.txt+Kat");


#### Tracker 

The tracker object is used to track all the data and what events are available. Controlling it controls the queue of the when emit. 

    function () {
        this.events = {};
        return this;
    }


[prototype](# "js")

THe various prototype methods for the tracker object. 

    Tracker.prototype.add = _"tracker:add";
    Tracker.prototype.remove = _"tracker:remove";
    Tracker.prototype.removeStr = _"tracker:remove string";
    Tracker.prototype.go = _"tracker:go";
    Tracker.prototype.cancel = _"tracker:cancel";
    Tracker.prototype.reinitialize = _"tracker:reinitialize";


[add](# "js") 

We can add events on to the tracker. We allow it to be an array of events passed in or a bunch of strings passed in as parameters.

    function (newEvents) {
        var tracker = this,
            events = tracker.events,
            handler = tracker.handler;

        if (arguments.length !== 1) {
            newEvents = Array.prototype.slice.call(arguments);
        } else if (typeof newEvents === "string") {
            newEvents = [newEvents];
        }


        newEvents.forEach(function (el) {
            var num, str, order;
            if (typeof el === "string") {
                str = el;
                num = 1;
            }
            if (Array.isArray(el) ) {
                if ((typeof el[1] === "number") && (el[1] >= 1) && (typeof el[0] === "string") ) {
                    num = el[1];
                    str = el[0];
                } 
            }
            if (str && (typeof num === "number") ) {
                if (events.hasOwnProperty(str) ) {
                    events[str] += num;
                } else {
                    tracker.emitter.on(str, handler, order);
                    events[str] = num;
                }
            }
        });
        tracker.go();
        return tracker;
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
                    num = el[1];
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
        return tracker;
    }
    
[remove string](# "js")

This is mainly for use with the `.off` method where the handler has already been removed from the event. This takes in just a string and removes the event entirely from the events object. It then runs `go` to see if emit time is ready.

    function (ev) {
        var tracker = this;

        delete tracker.events[ev];

        tracker.go();
        return tracker;
    }


[cancel](# "js")

This cancels the .when, removing the handler from all remaining events. 

    function () {
        var tracker = this, 
            emitter = tracker.emitter,
            handler = tracker.handler,
            event, keys;
        
        keys = Object.keys(tracker.events);

        for (event in keys) {
            emitter.off(event, handler);
        }
        return tracker;
    }

[go](# "js")

This is the primary activator. 

If reset is true, then we add those events before firing off the next round. 


    function () {
        var tracker = this, 
            ev = tracker.ev, 
            data = tracker.data,
            myth = tracker.mayth,
            events = tracker.events,
            emitter = tracker.emitter,
            cont = true;


        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
            emitter.emit(ev, data, myth, tracker.timing); 
        }
        return tracker;
    }

[reinitialize]() 

This returns the events to the original version. I would call it reset except that is a flag to call this. 

We first cancel everything to clear it out and then we attach the new stuff.

    function () {
        var tracker = this;

        tracker.cancel();
        tracker.add(tracker.original);
        tracker.go();
        return tracker;
    }

[doc]()

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

    *[add](#tracker-add)
 
    <a name="tracker-add" />
    #### add(arr/str events) 

    Add events to wait for.

    __arguments__

    This is the same form as the `events` option

    <a name="tracker-add" />
    #### remove

    <a name="tracker-add" />
    #### removeStr

    <a name="tracker-add" />
    #### go

    <a name="tracker-add" />
    #### cancel

    <a name="tracker-add" />
    ### reinitialize

The .when method creates a handler that has a `handler.tracker` object and that tracker object has the following methods. This is what is returned from that method. The handler itself is found in `tracker.handler`.

* .add(ev); .add(ev1, ev2, ...); .add([ev1, ev2, ...])  This method adds events to the array of events that should happen before firing. The event could be an array of event and number of times to fire as well as the boolean for placing it first. If an event already exists, this will increment its counter appropriately. 
* .remove(ev1, ev2, ...)  removes the event(s). Each one could be either a string or an array of `[ev, num]` specifying how many times to remove the event. 
* .cancel() This will remove the handler of the `.when` object and effectively removes this from ever being called. 

[example]()

    //todo

### On

It takes an event (a string) and a Handler or something that converts to a Handler.  To have segments that are always in order, use a Handler with an array value of handler-types that will be executed in order.


    function (ev, f, data, myth) {
        var emitter = this,
            handlers = emitter._handlers;

        f = new Handler(f, data, myth ); 

        if (handlers.hasOwnProperty(ev)) {
                handlers[ev].push(f);
        } else {
            handlers[ev] = [f];
        }

        return f;

    }

[doc]() 



### Handler

!!! Handlers should be scoped? Turtles all the way down?!

This is where we define handlers. It seems appropriate to sandwich them between on and off. 

The idea is that we will encapsulate all handlers into a handler object. When a function or something else is passed into .on and the others, it will be converted into a handler object and that object gets returned. If a handler object is passed in, then it gets attached. It will record which events it is attached to and one can use it to remove itself from any or all events that it is attached to. 

This is a constructor and it should return `this` if it is creating or the value if it is already an instance.

A handler can have values for data and myth. 

    function (value, data, myth) {
        if (value instanceof Handler) {
            if (typeof data !== "undefined") {
                value.data = data;
            }
            if (typeof myth !== "undefined") {
                value.myth = myth;
            }
            return value;
        }

        var handler = this,
            key;
        handler.name = "";
        options  = options || {};


        if (Array.isArray(value) ) {
            handler.value = value;
        } else {
            handler.value = [value];
        }

        for (key in options) {
            handler[key] = options[key];
        }

        return this;
    }

[prototype](# "js")

The prototype object

    Handler.prototype.execute = _":execute";


[execute](# "js")

Here we can execute a handler this. This is the whole point. We could have a variety of values here.

* string. This could be an action, in which case it is . Or it could be an event which case it is emitted, the data going along for the ride. 
* function. Classic. It gets executed. no given context
* handler. This is an object of type handler. It allows us to stash stuff in the object. 
* [possible handler types...]. The array form gets executed in order. The array can contain Handler objects that are then handled. It can also contain an array of global, fun, args. 

We have a cont value that if false will terminate execution of further handlers.

That and args are mainly for passing in when calling a handler from a handler. If a handler already has these bound, it will use the bound ones. 

We pass in data, emitter, args, event string into the handler functions. This order was chosen in likelihood of use. The event string is needed for the .when handler to do its job. 

All of the handlers are encapsulated in a try...catch that then calls the emitter's .error method (which can be overwritten). The default will rethrow the error with more information. 


    function (data, emitter, ev, that, args) {
        var handler = this,
            value = handler.value,
            i, n = value.length, 
            verb, vtype, act, 
            cont = true, 
            counters = emitter.counters;
        that = handler.that || that || null, 
        args = handler.args || args || null;

        if (counters.execute > counters.executeMax) {
            emitter.log("Exceeded max execute limit in one call", ev);
            return false;
        } else {
            counters.execute += 1;
        }

        for (i = 0; i <n; i += 1) {
            verb = value[i];
            vtype = typeof verb;
            try {
                if (vtype === "string") {
                    _":string verb"
                } else if (vtype === "function") {
                    cont = verb.call(that, data, emitter, args, ev);
                } else if (verb instanceof Handler) {
                    cont = verb.execute(data, emitter, ev, that, args);
                } else if (Array.isArray(verb) ) {
                    cont = verb[1].call(verb[0] || that, data, emitter, verb[2] || args, ev);
                }
            } catch (e) {
                emitter.error(e, ev, handler, i); 
            }
            if (cont === false) {
                return cont;
            }
        }

        return cont;
    }

[string verb](# "js")

The verb could be either an action, if it matches, or it is treated as an event. Handler.timing is a string that if equal to later, emits the event as a later and if firstLater, then emits later but first in queue. Anything else, including undefined, leads to .emit.

An action is an instanceof Handler. So we call its execute method. Hope it is not self-referential...but if it is is the `counters.execute` variable should stop infinity in its tracks.

    if (  (act = emitter.action(verb)) ) {
        emitter.log(ev + " --> " + verb);
        cont = act.execute(data, emitter, ev, args, that);
    } else if (emitter._handlers.hasOwnProperty(verb) ) {
        emitter.log(ev + " --emitting: " + verb );
        if (handler.timing === "later") {
            emitter.later(verb, data);
        } else if (handler.timing === "firstLater") {
            emitter.later(verb, data, true);
        } else {        
            emitter.emit(verb, data, handler.timing, true);
        }
    } else {
        emitter.log("Unknown string:" + verb);
    }

[make](# "js")

This is a simple wrapper for new Handler

    function (value, options) {
        return new Handler(value, options);
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


        // easy case -- check for equality of reference
        if (fun instanceof Handler) {
            _":remove Handler"
            emitter.log("handler for event removed " +  ev + " :: " + (fun.name || "") );
            return emitter;
        }


        // harder -- check for handler whose value is one of these
        if (typeof fun === "function" || Array.isArray(fun) || typeof fun === "string") {
            _":find and remove handler with matching value"
            emitter.log("handler for event removed " +  ev);            
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


[find and remove handler with matching value](# "js")

Each el is a Handler object. They store all their values in value 

    handlers[ev] = handlers[ev].filter(function (el) {
        if ((el.value.length === 1) && (el.value[0] === fun)) {
            return false;
        } else if (el.value === fun) {
            return false;
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

        f = new Handler(f, {that:that, args:args});

        f.n = n || 1;

        g = function() {
            f.n -=1;
            if (f.n <= 0) {
                emitter.off(ev, f);
            }
        };

        f.value.unshift(g);

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
            emitter.log("event cleared", ev );
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

As this is called without context, we have bound the resume function to the emitter instance. 

For the `.soon`, `.later` commands, we use a waiting queue. As soon as next tick is called, it unloads the first one onto the queue, regardless of whether there is something else there. This ensures that we make progress through the queue. Well, assuming there is a next tick. 

     function () {
        var f, ev, handlers, data, passin, evObj, events, 
            emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting, 
            resume = emitter.resume,
            counters = emitter.counters; 
        
        counters.resume += 1;
        if (counters.resume > counters.resumeMax) {
            emitter.log("resume accessed too many times", counters.resume);
            emitter.resumeMax();
        }
        counters.execute = 0;

        while ( (queue.length > 0 ) && (counters.loop < counters.loopMax) ) {
            counters.loop += 1;
            evObj = queue[0];
            events = evObj.events;
            passin = {};

            eventsLoop:
            while ( (events.length > 0) && (counters.loop < counters.loopMax) ) {
                counters.loop += 1;
                ev = events[0].scopeEvent;
                handlers = events[0].handlers;
                while ( (ev.handlers.length > 0 ) && (counters.loop < counters.loopMax) ) {
                    counters.loop += 1;
                    f = handlers.shift();
                    if (f) {
                        passin = _":passin";
                        emitter.log("firing", f, ev, evObj);
                        f.execute(data, passin);
                        emitter.log("fired", f,  ev, evObj);
                        _":do we halt event emission"
                    }
                }
                if (ev.handlers.length === 0) {
                    ev.handlers.shift();
                }
            } 
            
            if (events.length === 0) {
                queue.shift();
            }

        } 

        if (counters.loop > counters.loopMax) {
            emitter.log("loop count exceeded", counters.loop, queue[0].ev, queue);
            counters.loop = 0;
            emitter.nextTick(resume);
        } else if (waiting.length > 0) {
            emitter.nextTick(function () {
                if (waiting.length > 0)  {
                    queue.push(waiting.shift());
                }
                resume();
            });
        } else {
            emitter.log("all emit requests done");
        }

    }

[passin]()

This is the full object that is passed in to the handler functions as the second argument. The data.emit is the same as the first argument. 

    {
        emitter : emitter,
        scope : ev,
        data : {
            emit : evObj.emitData,
            event : evObj.scopeData[ev],
            events : evObj.scopeData,
            handler : f.data,
            handlers : []
        },
        myth : {
            emit : evObj.emitMyth,
            event : evObj.scopeMyth[ev],
            events : evObj.scopeMyth,
            handler : f.myth,                                
            handlers : []
        },
        event : evObj.ev,
        evObj : evObj,
        handler : f

    }

[do we halt event emission](# "js")

If f modifies the passed in second argument to include stop:true, then the event emission stops. This includes the current remaining handlers for that scope's events as well as all remaining bubbling up levels. 

We shift the queue and break out a couple of times. 

    if ( passin.stop === true ) {
        events = [];
        break eventsLoop;
    }

[doc]() 

This describes the passin object for the handler arguments

    Every handler that is called gets two arguments passed to it: `data` from the emit event and `passin` which contains

    * `emitter` is he object that manages the events. 
    * `scope` is the current scope event level.
    * `data` contains data from `emit`, current scope `event` level, all the `events` along the scope chain, and data from the `handler` itself. 
    * `myth` is the messy object from each of the same sources as data. 
    * `event` is the full original event string.
    * `evObj` is the full object containing various pieces with `events` being the arrray of `{scopeEvent, handlers} If you want to manipulate the flow, this is a good place to put it.
    * `handler` is the handler being used. It is a wrapped thingy, so don't expect it to be a function. 

    In addition, `passin.stop` being set to true will cause the event handling and bubbling to stop.

    __example__

    Here we demonstrate using the various passin properties

        _":example"

[example]()

    function (data, passin) {
        var ret = [];
        ret.push(passin.data.emit === data);
        ret.push(passin.scope);
        ret.push(JSON.stringify(passin.data.emit));
        ret.push(JSON.stringify(passin.data.event));
        ret.push(JSON.stringify(passin.data.events));
        ret.push(JSON.stringify(passin.data.handler));

    }

### Next Tick

The cede control function -- node vs browser.

    (typeof process !== "undefined" && process.nextTick) ? process.nextTick 
        : (function (f) {setTimeout(f, 0);})
    

### Error Handling

All handlers are encapsulated in a try..catch. This allows for easy error handling from controlling the emitter.error method. It is passed in the error object, event string, handler, and the place in the handler's array which caused the problem. 

What is done here is a default and suitable for development. In production, one might want to think whether throwing an error is a good thing or not. 


    function (e, ev, h, i) {
        var name = h.name || "";

        throw Error(ev + ":" + name + (i ? "["+i+"]" : "") + "\n" + e.message);

    }

### Name an action

This is for storing Handler type objects under a name string, generally some active description of what is supposed to take place. The Handler type can be anything that converts to Handler. 

If just one argument is provided, then the handler is returned. 

If two arguments are provided, but the second is null, then this is a signal to delete the action. 


    function (name, handler, that, args) {
        var emitter = this;

        if (arguments.length === 1) {
            return emitter._actions[name];
        }

        if ( (arguments.length === 2) && (handler === null) ) {
            delete emitter._actions[name];
            emitter.log("Removed action " + name);
            return name;
        }
        
        var action = new Handler(handler, {that:that, args:args, name: name}); 

        if (emitter._actions.hasOwnProperty(name) ) {
            emitter.log("Overwriting action " + name);
        }

        emitter._actions[name] = action;

        return name;
    }

We return the name so that one can define an action and then use it. 

### Name a scope

The usefulness of scopes is twofold. One, it allows for a hierarchial calling of events, such as bubbling in the browser (well, bubbling down, I suppose). But the other use is in having scope-related objects that one can access. That is, context is given from an event perspective. So instead of each button listening for an event, we can have each event retaining a reference to the button. 

This is where we define the function for adding/removing that context. Given an event string and a non-null value, that value will be stored under that string. A null value removes the string from the event. If there is no second argument, then the scope object is returned. 

We return the event name so that it can then be used for something else. 

    function (ev, data, myth) {
        var emitter = this,
            scope;

        if (arguments.length === 0) {
            return Object.keys(emitter._scopes);
        }

        scope = emitter._scopes[ev];

        if (arguments.length === 1) {           
            if (scope) {
                return scope;
            } else {
                return {
                    data : null,
                    myth : null
                };
            }
        }
        
        if ( (data === null) && (myth === null) ) {
            emitter.log("Deleting scope event", ev, scope);
            delete emitter._scopes[ev];
            return scope;
        }

        if (emitter._scopes.hasOwnProperty(ev) ) {
            emitter.log("Overwriting scope event", ev, data, myth, emitter._scopes[ev] );
        } else {
            emitter.log("Creating scope event", ev, data, myth);
        }

        emitter._scopes[ev] = {
            data : (typeof data === "undefined" ? null : data),
            myth : (typeof myth === "undefined" ? null : myth)
        };

        return ev;
    }

[doc]()

    <a name="scope" />
    ### scope(str ev, obj data, obj myth) --> scope keys/ {data, myth} / ev

    This manages associated data and other stuff for the scoped event ev. 

    __arguments__ 

    * `ev` This is the full event to associate the information with. 
    * `data` This is data to be available when the event is called. It should be JSONable.
    * `myth` This is complicated stuff associated with the event, maybe DOM elements, global 
    state, functions. 

    __return__

    * 0 arguments. Leads to the scope keys being returned. 
    * 1 arguments. Leads to specified scope's data/myth being returned as {data:data, myth:myth}
    * 2+ arguments. Leads to the event string being returned after storing the data/myth.


[example]()

    // stores reference to button element
    emitter.scope("button:submit", {id:"great"}, {dom: submitButton});
    // returns submitButton
    emitter.scope("button:submit");
    //overwrites submitButton
    emitter.scope("button:submit", , popupWarning);
    //clears scope button:submit
    emitter.scope("button:submit", null, null);


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
        var ret = function (description) {
            var f; 
            log._full.push(Array.prototype.slice.call(arguments, 0));
            log._simple.push(description);
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

The readme for this. A lot of the pieces come from the doc sections.

    ## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

    _"introduction:doc"

    ### Install

    Install using `npm install event-when` though I prefer doing it via package.json and `npm install`. 

    ### Method specification

    These are methods on the emitter object. 

    * [Emit](#emit)
    * [When[(#when)

    _"emit:doc"

    _"when:doc"

    _"on:doc"

    _"off:doc"

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

    _"tracker:doc"


## old README

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

## Full Example

This is a basic example that runs all the documentation code. 

    var EvW = require("../index.js");
    var emitter = new EvW();

    _"on:example"

    _"emit:example"

    _"later:example"


## TODO

Do server example, fix up the escape part of the paren parser. 

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
      "devDependencies" : {
        "literate-programming" : "~0.7.2"
      },
      "dependencies":{
      },
      "scripts" : { 
        "prepublish" : "node ./node_modules/literate-programming/bin/literate-programming.js eventwhen.md",
        "compile" : "node ./node_modules/literate-programming/bin/literate-programming.js eventwhen.md",
        "test" : "node ./test/testrunner.js"
      },
      "keywords": ["event"]
    }

## Change Log

### Version 0.6.0 Thoughts

At the very least, better documentation. I wrote this thing and find it hard to figure out how to use it the way I want to. But I also think there might be some inaccuracies. So I hope to fix this up. 

What I want is a very clear ability to use actions. I am also wondering about scoping it. One could have separate event emitters or perhaps we can use one which scopes an event to something, which could be a key string with an object value that becomes available somehow. 

... So the scope thing is cool. It bubbles up with the possibility of events being stopped. Each handler has access to the data at each of the scope levels. So the general scope level can get a scope object from the specific. 

But the data for the handlers is getting complicated. So the callback signature will be f(data, obj) where data is anything being passed along by the event (for simple functions) while obj contains all the different contexts, etc.  There is no this being bound; one can bind the function f if you want a context, but this will not do anything. All needed stuff should be in obj. 

So what will be in obj? The keys will be data (redundant, but...),  hanCon for handler context, hanArgs for an array of "data" to pass in,  evObj, ev, emitter, 

Thinking about .when only emitting events, not doing other handlers. I think that makes it much cleaner to handle. Not sure why I included the other ways. Maybe thought that having to define an event and then just one handler on it seemed silly. But really, that's what events are about. 

### Version 0.5.0 Thoughts

I have made a mess of the emit events. So here is the new paradigm. `.emit` is equivalent to a function call. It gets called immediately and its sequence of emits is followed as if they are function calls. The hope is that all the handlers of an event emitted from within an emitted event sequence wil be done completely before the rest of the original emit's handlers fire. 

`.later` is asynchronous mode. It will emit the events, in the order queued, at the next tick. Each one happens after a next tick. So the entire sequence from one emit event will happen before the next `.later` is called. I think I will have an optional parameter to specify push vs unshift behavior with default being push. 

Also, adding use of emitter.name in logs as well as numbering the emits called for a given event. The string form for a handler will also lead to a log event if no action/event fits. 

### Version 0.4.0 Thoughts

The idea is to create an action sentence that invokes the handler. So we attach the sentence to the event and then stuff happens to that. The handler can be a function or it could be an array of functions, etc. The point of invocation is when the sentence is used as a key to get the handler. So this allows dynamism which could be good, could be bad. The hard work, I think, is to rewrite the handler calling to be abstracted out to another level. I probably need to introduce an object of type handler. 

## gitignore

We should ignore node_modules (particularly the dev ones)

    node_modules
    ghpages

## npmignore

We should ignore test, examples, and .md files

    test
    examples
    *.md

## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "0.10"
      - "0.8"
      - "0.6"

## LICENSE MIT


The MIT License (MIT)
Copyright (c) 2013 James Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
