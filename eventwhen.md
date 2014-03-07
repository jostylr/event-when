# [event-when](# "version: 0.6.0-pre| jostylr")


This is an event library that emphasizes flow-control from a single dispatch object. 

## Introduction

This provides a succinct introduction to the library for the readme and this file.

[doc]()

    This is an event library, but one in which events and listeners are coordinated through a single object. The emphasis throughout is on coordinating the global flow of the program. 

    Most event libraries suggest making objects into emitters. This library is designed to allow you to attach the object to the event/handler/emit. It also allows you to listen for events before the corresponding object exists. Of course, if you want to have various emitters, go for it. 

    There are several noteworthy features of this library:

    * When. This is the titular notion. The `.when` method allows you to specify an event to emit after various specified events have all fired. For example, if we call a database and read a file to assemble a webpage, then we can do something like 
        ```
        emitter.when(["file parsed:jack", "database returned:jack"], "all data retrieved:jack");
        ```
        This is why the idea of a central emitter is particularly useful to this library's intent.
    * Scope. Events can be scoped. In the above example, each of the events are scoped based on the user jack. It bubbles up from the most specific to the least specific. Each level can access the associated data at all levels. For example, we can store data at the specific jack event level while having the handler at "all data retrieved" access it. Works the other way too. 
    * Actions. Events should be statements of fact. Actions can be used to call functions and are statements of doing. "Compile document" is an action and is a nice way to represent a function handler. "Document compiled" would be what might be emitted after the compilation is done. This is a great way to have a running log of event --> action. 
    * Stuff can be attached to events, emissions, and handlers. Emits send data, handlers have contexts, and events have scope contexts.

    Please note that no particular effort at efficiency has been made. This is about making it easier to develop the flow of an application. If you need something that handles large number of events quickly, this may not be the right library. 

    ## Using

    In the browser, include index.js. It will attach the constructor to EventWhen in the global space. 

    For node, use `npm install index.js` or, better, add it to the package.json file with `--save` appended. 

    Then require and instantiate an emitter:
    ```
    var EventWhen = require('event-when');
    emitter = new EventWhen();
    ```

## Files

The file structure is fairly simple. 


* [index.js](#main "save:|jshint") This is the node module entry point and only relevant file. It is a small file.
* [ghpages/index.js](#main "save:") This is for browser access. 
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


    /*jshint eqnull:true*/
    /*global setTimeout, process, module, console */

    ;(function () {
        var empty = {};

        var Handler = _"handler";

        _"handler:prototype"

        var Tracker = _"tracker";

        _"tracker:prototype"

        var EvW = _"constructor";

        _"constructor:prototype"

        if (module) {
            module.exports = EvW;
        } else {
            this.EventWhen = EvW;
        }

    } () );


### Constructor

This manages an event emitter.

We set some variables; see the doc section. 

We bind `looper` which is the execution lop to the instance since it will be passed in without context via nextTick or analog.

    function () {

        this._handlers = {};
        this._queue = [];
        this._waiting = [];
        this._actions = {};
        this._scopes = {};
        this.scopeSep = ":";
        this.looping = false;
        this.loopMax = 1000;
        this.emitCount = 0;
        this.timing = "momentary";

        this.looper = this.looper.bind(this);

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    
    
    EvW.prototype.emit = _"emit";
    EvW.prototype.eventLoader = _"event loader";
    EvW.prototype.now = _"emit:convenience method| substitute(TIMING, now)";
    EvW.prototype.momentary = _"emit:convenience method| substitute(TIMING, momentary)";
    EvW.prototype.soon = _"emit:convenience method| substitute(TIMING, soon)";
    EvW.prototype.later = _"emit:convenience method| substitute(TIMING, later)";
    EvW.prototype.scope = _"scope";
    
    EvW.prototype.on = _"on";
    EvW.prototype.off = _"off";
    EvW.prototype.once = _"once";
    EvW.prototype.when = _"when";

    EvW.prototype.looper = _"looper";
    EvW.prototype.nextTick =  _"nextTick";
    EvW.prototype.stop = _"stop";

    EvW.prototype.log = function () {}; //noop stub
    EvW.prototype.makeLog = _"makeLog";
    EvW.prototype.events = _"events";
    EvW.prototype.handlers = _"handlers";
    EvW.prototype.action = _"action";
    EvW.prototype.makeHandler = _"handler:make";
    EvW.prototype.error = _"error";

[doc]()

    Each instance has, in addition to the prototype methods listed below, the following public properties: 

    * `scopeSep` is the scope separator in the event parsing. The default is `:`. We can have multiple levels; the top level is the global event. 
    * `count` tracks the number of events emitted. Can be used for logging/debugging. 
    * `looping` tracks whether we are in the executing loop. 
    * `loopMax` is a toggle to decide when to yield to the next cycle for responsiveness. Default 1000. 
    * `timing` The default timing for `.emit` which defaults to "momentary", i.e., appending to queue. 

    It also has "private" variables that are best manipulated by the methods.

    * `_handlers` has key:value of `event:[handler1, handler2,..]` and will fire them in that order. 
    * `_queue` consists of events to be fired in this tick.
    * `_waiting` is the queue for events to be fired after next tick.
    * `_actions` has k:v of `action name: handler` The handler can be of type Handler or anything convertible to it. 
    * `_scopes` has k:v of `scope name: object` When an event is emitted with the given scope, the object will be passed in and is accessible to any handler reacting to an event along the scope chain.


#### Emit

This function emits the events.

First it gets an array of the various scope level events and loads their context objects. We create the event object which holds all relevant bits for this event call. 


    function (ev, data, timing) {
        var emitter = this, 
            sep = emitter.scopeSep, 
            scopes = {};

        timing = timing ||emitter.timing || "momentary";

        emitter.log("emit", ev, data, timing);

        var pieces = ev.split(sep);

        emitter.emitCount += 1;

        var evObj = {
            emitter: emitter,
            ev : ev,
            data : data,
            scopes : scopes, 
            pieces : pieces,
            count : emitter.emitCount,
            timing : timing
        };

        var events = evObj.events = [];

        pieces.reduce(function (prev, el) {
            var ret = prev + (prev ? sep + el : el);            
            scopes[ret] = emitter.scope(ret);
            var h = emitter._handlers[ret];
            if (h) {
                //unshifting does the bubbling up
               events.unshift({scopeEvent: ret, handlers: h.slice()});
            }
            return ret;
        }, ""); 

        emitter.eventLoader(timing, evObj);

        emitter.looper();

        return emitter;
    }


[doc]() 


    ### emit(str ev, obj data, str timing) --> emitter

    Emit the event.  

    __arguments__

    * `ev`  A string that denotes the event. 
    * `data` Any value. It will be passed into the handler as the first argument. 
    * `timing` One of "now", "momentary", "soon", "later" implying emission first on queue, last on queue, first on next cycle, last on next cycle, respectively. "Momentary" is the default if not provided as that will preserve the order of emitting.

    __return__

    The emitter for chaining. The events may or may not be already emitted depending on the timing. 

    __convenience forms__ 

    * `.now`  Event A emits B, B fires after the emitting handler finishes, but before other handler's for A finishes. This is the function calling model.
    * `.momentary` Event A emits B, B fires after A finishes. This is more of a synchronous callback model. It is the same as `.emit` with the default setting.
    * `.soon` Event A emits B then C, both with soon, then C fires after next tick. B fires after second tick.
    * `.later` Event A emits B then C, both with later, then B fires after next tick. C fires after second tick.

    __scope__ 

    Note that if ev contains the event separator, `:` by default, then it will be broken up into multiple events, each one being emitted. The order of emission is from the most specific to the general (bubbling up). `emitter.scopeSep` holds what to split on.

    To stop the emitting and any bubbling, set `evObj.stop === true` in the handler with signature `(data, evObj)`. To do more fine-controlled stopping, you need to manipulate evObj.events which is an array consisting of objects of the form `{str scopeEvent, arr handlers}`. 

    Once started, the handlers for all the scopes fire in sequence without interruption unless an `emit.now` is emitted. To delay the handling, one needs to manipulate `evObj.emitter._queue` and `._waiting`. Not recommended. 


    __example__

        _":example"

[example]()

    emitter.emit("text filled", someData);
    emitter.now("urgent event");
    emitter.later("whenever", otherData);
    emitter.soon("i'll wait but not too long");
    // generic:specific gets handled then generic
    emitter.emit("generic:specific");

[convenience method]()

This makes the now, later, ... methods. TIMING gets replaced with the timing. That's it!

    function (ev, data) {
        var emitter = this;
        emitter.emit(ev, data, "TIMING");
        return emitter;
    }


#### Event Loader

This loads the event object in the appropriate queue. 

    function (timing, evObj) {
        var emitter = this;

        switch (timing) {
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


#### Scope

The usefulness of scopes is twofold. One, it allows for a hierarchial calling of events, such as bubbling in the browser (well, bubbling down, I suppose). But the other use is in having scope-related objects that one can access. That is, context is given from an event perspective. So instead of each button listening for an event, we can have each event retaining a reference to the button. 

This is where we define the function for adding/removing that context. Given an event string and a non-null value, that value will be stored under that string. A null value removes the string from the event. If there is no second argument, then the scope object is returned. 

We return the event name so that it can then be used for something else. 

    function (ev, obj) {
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
                return null;
            }
        }
        
        if ( obj == null ) {
            emitter.log("Deleting scope event", ev, scope);
            delete emitter._scopes[ev];
            return scope;
        }

        if (emitter._scopes.hasOwnProperty(ev) ) {
            emitter.log("Overwriting scope event", ev, obj, emitter._scopes[ev] );
        } else {
            emitter.log("Creating scope event", ev, obj);
        }

        emitter._scopes[ev] = obj;

        return ev;
    }

[doc]()

    ### scope(str ev, obj) --> scope keys/ obj / ev

    This manages associated data and other stuff for the scoped event ev. 

    __arguments__ 

    * `ev` This is the full event to associate the information with. 
    * `obj` This is whatever one wants to associate with the scope. 

    __return__

    * 0 arguments. Leads to the scope keys being returned. 
    * 1 arguments. Leads to specified scope's object being returned.
    * 2 arguments. Leads to the event string being returned after storing the object.


[example]()

    // stores reference to button element
    emitter.scope("button:submit", {id:"great", dom: submitButton});
    // returns submitButton
    emitter.scope("button:submit");
    //overwrites obj
    emitter.scope("button:submit", popupWarning);
    //clears scope button:submit
    emitter.scope("button:submit", null);


#### On

It takes an event (a string) and a Handler or something that converts to a Handler.  To have segments that are always in order, use a Handler with an array value of handler-types that will be executed in order.


    function (ev, f, context) {
        var emitter = this,
            handlers = emitter._handlers;

        f = new Handler(f, context ); 

        if (handlers.hasOwnProperty(ev)) {
                handlers[ev].push(f);
        } else {
            handlers[ev] = [f];
            handlers[ev].contains = f.contains;
        }

        return f;

    }

[doc]() 

    ### on(str ev, Handler f, obj context) --> Handler

    Associates handler f with event ev for firing when ev is emitted.

    __arguments__

    * `ev` The event string on which to call handler f
    * `f` The handler f. This can be a function, an action string, an array of handler types, or a handler itself.
    * `context` What the this should be set to.

    __return__

    The Handler which should be used in `.off` to remove the handler, if desired. 

#### Off

This removes handlers. The nowhen boolean, when true, will leave the when handlers on the when events. This effectively blocks those events from happening until some manual reworking on the event. Since the no argument function wipes out all handlers, period, we do not need to worry here. 


    function (events, fun, nowhen) {

        var emitter = this;

        var handlers = emitter._handlers;
        var h, f;

        if ( (events == null) && (fun == null) ) {
            emitter._handlers = {};
            emitter.log("all handlers removed");
            return emitter;
        }

        if (events == null) {
            events = Object.keys(emitter._handlers);
        } else if (typeof events === "string") {
            events = [events];
        }

        if ( typeof fun === "boolean") {
            nowhen = fun;
            fun = null;
        }

        if (fun) {
            events.forEach( function (ev) {
                _":remove Handler"
                emitter.log("handler for event removed", ev, fun );
            });
            return emitter;    
        } 


        events.forEach( function (ev) {
            if (nowhen === true) {
                delete handlers[ev];
                emitter.log("removed handlers on event, leaving on when", ev); 
                return emitter;
            } else {
                _":remove handlers checking for when handlers"
                emitter.log("removing handles on event", ev);
            }            

        });
        
        return emitter;
    }          

[remove handler](# "js")

This will remove all handlers that are or contain the passed in f. 

    handlers[ev] = handlers[ev].filter(function (handler) {
        return ! handler.contains(fun);
    }); 
    if ( (nowhen !== true) && fun.hasOwnProperty("tracker") )  {
        fun.tracker._removeStr(ev);
    }



[remove handlers checking for when handlers](# "js")

    
    h = handlers[ev];
    while (h.length > 0) {
        f = h.pop();
        if (f.hasOwnProperty("tracker") ) {
            f.tracker._removeStr(ev);
        }
    }
    delete handlers[ev];


[doc]()

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

        _":example"

[example]()

    //todo. 

#### Once

This method produces a wrapper around a provided function that automatically removes the handler after a certain number of event firings (once is default). The new handler is what is returned.

The way it works is the f is put into a handler object. This handler object then has a function placed as the first to be invoked. When invoked, it will decrement the number of times and remove the handler if it is less than or equal to 0. That's it. No function wrapping in a function.

We allow for n and context to be switched. Minimal risk of unintended consequences. 

    function (ev, f, n, context) {
        var emitter = this, 
            handler, g, temp;

        handler = new Handler([f], context);

        if ( (typeof n !== "number") && (typeof context === "number") ) {
            temp = n;
            n = context;
            context = temp;
        }

        handler.n = n || 1;

        g = function() {
            handler.n -=1;
            if (handler.n <= 0) {
                emitter.off(ev, handler);
            }
        };

        handler.value.unshift(g);

        emitter.on(ev, handler); 

        emitter.log("assigned event times", ev, n, f, context, handler);

        return handler;
    }

[doc]()

    ### once(event, handler f, int n, obj context) --> handler h

    This attaches the handler f to fire when event is emitted. But it tracks it to be removed after firing n times. Given its name, the default n is 1.

#### When

This is a key innovation. The idea is that once this is called, a handler is created that attaches to all the listed events and takes care of figuring when they have all called. 

When all the events have fired, then the given event emits with a data object that is an array  of all the fired event's data, specifically the array elements are arrays of the form `[event name, data]`. 

The return is the tracker which contains all things that might need to be accessed. It also contains the remove methods to cancel the `.when`.

It has the argument of timing used to time the emitting of the event to be fired. The argument reset allows for reseting to the initial state once fired. 

Emitting scoped events will count as a firing of the parent event, e.g., `.when([["button", 3], "disable")` will have `.emit("button:submit")` remove one of the button counts (unless event bubbling is stopped). But `.emit("button")` will not count for any `.when("button:submit")`. 


    function (events, ev, timing, reset) {    

        var emitter = this;

        emitter.log(".when loaded", events, ev, timing, reset);

        var tracker = new Tracker ();

        tracker.emitter = emitter;
        tracker.ev = ev;
        tracker.data = [];
        _":assign timing reset"
        tracker.original = events.slice();


        var handler = new Handler (function (data, evObj) {
            var ev = evObj.cur[0];
            tracker.data.push([ev, data]);
            tracker.remove(ev);
        });

        handler.tracker = tracker;

        tracker.handler = handler; 

        tracker.add(events);


We return the tracker since one should use that to remove it. If you want the handler itself, it is in tracker.handler. It just seems more natural this way since the manipulations use tracker. 

        return tracker;
    }

[assign timing reset]()

Four arguments is not so good because who can remember the order? Since reset should be a string while reset should be a boolean, we can handle this.

Note that we are not actually checking for correctness, just trying to make sure that properly written, but unordered, is okay. 

    if (typeof timing === "string") {
        tracker.timing = timing;
        tracker.reset = reset || false;
    } else if (typeof timing === "boolean") {
        tracker.reset = timing;
        if (tracker.reset) {
            tracker.timing = reset;
        } else {
            tracker.timing = emitter.timing;
        }
    } else {
        tracker.timing = emitter.timing;
        tracker.reset = reset || false;
    }



[doc]()


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

        _":example"

[example]()

    emitter.when(["file read", "db returned"], "data gathered");
    emitter.emit("


#### Action

This is for storing Handler type objects under a name string, generally some active description of what is supposed to take place. The Handler type can be anything that converts to Handler. 

If just one argument is provided, then the handler is returned. 

If two arguments are provided, but the second is null, then this is a signal to delete the action. 


    function (name, handler, context) {
        var emitter = this;

        if (arguments.length === 0) {
            return Object.keys(emitter._actions);
        }

        if (arguments.length === 1) {
            return emitter._actions[name];
        }

        if ( (arguments.length === 2) && (handler === null) ) {
            delete emitter._actions[name];
            emitter.log("Removed action ", name);
            return name;
        }
        
        var action = new Handler(handler, context); 

        if (emitter._actions.hasOwnProperty(name) ) {
            emitter.log("Overwriting action ", name);
        }

        emitter._actions[name] = action;

        return action;
    }

We return the name so that one can define an action and then use it. 

[doc]() 

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

#### Looper

This implements the looping over the queue. It is designed to avoid recursive stack calls. To do this, we keep track of whether we are looping or not in the emitter.looping variable. This should only get called if that flag is false. 

For example, A is emittted and stats the loop. A emits B which then sees that the loop is active and does not call the loop. B does get queued and after the first handler of A finishes, the queue is consulted again. 

This continues progress through the queue. We use either setTimeout (browser) or nextTick (node) to allow for other stuff to happen in between each 1000 calls.

As this is called without context, we have bound the resume function to the emitter instance. 

For the `.soon`, `.later` commands, we use a waiting queue. As soon as next tick is called, it unloads the first one onto the queue, regardless of whether there is something else there. This ensures that we make progress through the queue. Well, assuming there is a next tick. 


    function () {
        var emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting,
            loopMax = emitter.loopMax,
            self = emitter.looper,
            loop = 0, 
            f, ev, evObj, events, cur, ind;


        if (emitter.looping) {
            emitter.log("looping called again");
            return;
        }

        if ( (queue.length === 0) && (waiting.length > 0) ) {
            queue.push(waiting.shift());
        }


        emitter.looping = true;

        while ( (queue.length) && (loop < loopMax ) ) {
            _"act"
            loop += 1;
        }

        emitter.looping = false;

        if (queue.length) {
            emitter.log("looping hit max", loop);
            emitter.nextTick(self);
        } else if ( waiting.length ) {
            emitter.nextTick(self);
        }

        return emitter;

    }


##### Act

This is to execute a single handler on the event queue. 

    
    evObj = queue[0];
    events = evObj.events;

    if (events.length === 0) {
        queue.shift();
        continue;
    }


    cur = events[0]; 

    if (events[0].handlers.length === 0) {
        events.shift();
        continue;
    }


    ev = cur.scopeEvent;
    f = cur.handlers.shift();
    if (f) {
        evObj.cur = [ev, f];
        emitter.log("firing", ev, evObj);
        f.execute(evObj.data, evObj);
        emitter.log("fired", ev, evObj);
        _":deal with stopping"

    }


[deal with stopping]()

If f modifies the passed in second argument to include stop:true, then the event emission stops. This includes the current remaining handlers for that scope's events as well as all remaining bubbling up levels. 

We remove the event from the queue. Since the queue may have changed, we find it carefully.

    if ( evObj.stop === true ) {
        emitter.log("emission stopped", ev, evObj);
        ind = queue.indexOf(evObj);
        if (ind !== -1) {
            queue.splice(ind, 1);
        }
        continue;
    }


#### NextTick

The cede control function -- node vs browser.

    (typeof process !== "undefined" && process.nextTick) ? process.nextTick 
        : (function (f) {setTimeout(f, 0);})
    

#### Stop

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

[doc]() 

    ### stop(str/bool toRemove) --> emitter

    Removes events from the queue. 

#### Error

All handlers are encapsulated in a try..catch. This allows for easy error handling from controlling the emitter.error method. It is passed in the error object, event string, handler, and the place in the handler's array which caused the problem. 

What is done here is a default and suitable for development. In production, one might want to think whether throwing an error is a good thing or not. 

// e, value, data, evObj, context

Since we are throwing an error, we need to make sure emitter.looping is set to false so that if the error is handled and path resumes, we still get a flow of the emitter. 

    function (e) {
        var emitter = this;
        emitter.looping = false;
        throw Error(e);
    }

[doc]() 

    ### error()

    This is where errors can be dealt with when executing handlers. It is passed in the error object as well as the event, data, handler, context... If you terminate the flow by throwing an error, be sure to set emitter.looping to false. This is a method to be overwritten. 


####  MakeLog

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

[doc]()

    ### makeLog() --> fun

    This creates a log function. It is a convenient form, but the log property should often be overwritten. If this is not invoked, then the log is a noop for performance/memory. 

    `emitter.log` expects a description as a first argument and then whatever else varies. 


#### Events

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

[doc]()

    ### events( fun/str/reg partial, bool negate) --> arr keys

    This returns a list of defined events that match the passed in partial condition. 

#### Handlers

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

[doc]() 

    ### handlers(arr events) --> obj evt:handlers

    Given a list of events, such as given by event listing, produce an object with those events as keys and the values as the handlers. 

### Handler


This is where we define handlers. It seems appropriate to sandwich them between on and off. 

The idea is that we will encapsulate all handlers into a handler object. When a function or something else is passed into .on and the others, it will be converted into a handler object and that object gets returned. If a handler object is passed in, then it gets attached.

This is a constructor and it should return `this`. Whatever value is passed in will get wrapped in a handler. 

A handler can have a context. The closest context to an executing handler will be used.  

    function (value, context) {
        if ( (value instanceof Handler) && 
             (arguments.length === 1) ) {
                return value;
        }

        var handler = this;

        handler.value = value; 
        handler.context = context;

        return handler;
    }

[prototype]()

The prototype object.

* contains Returns a boolean indicating whether the given handler type is contained in the handler. 
* execute Executes the handler
* summarize Goes level by level summarizing the structure of the handler


---
    Handler.prototype.execute = _":execute"; 
    Handler.prototype.contains = _":contains";
    Handler.prototype.summarize = _":summarize";


[traverse]()

This is a generic skeleton to copy in making traversals through the handler objects. 

I tried to make it into a stand-alone walker, but it just made everything more complicated. This is largely setup with the idea of using return values in each if. If not, you can do else ifs. 

    function me (val, value) {

This can be called as a method, in which case this should have a value.

        if (typeof value === "undefined ) {     
            value = this.value;
        }

Any intial work can be done here. A short circuit for the contains method is put here. 


A string denotes an action

       if (typeof value === "string") {

        }

        if (typeof value === "function") {
        }


We use the empty object to make sure that we do not accidentally get the global object with this (would happen if el is undefined).

        var ret;
        if ( Array.isArray(value) ) {
            ret = value.map(function (el) {
                return me.call({}, val, el);
            });
do something with ret
        }

Dealing with it being a handler. Note that value.value is probably what is going to be used. So you could also decide to if value.value is defined, then call me with that, instead of using it as a method. 

        if ( value && typeof value.METHODNAME === "function" ) {

        } 

Cleanup. Maybe an error to deal with it at this point. Or just return nothing. 


    }


[error]()

The error code for dealing with traversal; it appears in two places as a shortcut. 

    if (typeof com.error === "function") {
        return com.error(com, args, value); 
    } else {
        return ; 
    }

[contains]() 

This will search for the given possible value to determine if the Handler contains it. 

If there is no value as second argument, it is assumed to be called as a method of a Handler and uses its value. 

The first if will says that the handler contains itself.

    function me (val, value) {
        if (this === val) {
            return true;
        }
        
        value = value || this.value;

        if (value === val) {
            return true;
        } 

        if ( Array.isArray(value) ) {
            return value.some(function (el) {
                return me.call(empty, val, el);
            });
        }

        if ( value && typeof value.contains === "function" ) {
            return value.contains(val);
        } 

        return false;

    }


[execute]()

Here we handler executing a handler. We could have a variety of values here.

* string. This should be an action. We lookup the action and use the function. 
* function. Classic. It gets executed.
* handler. This is an object of type handler and how we will always start. We iterate through handlers to find executable types.
* [possible handler types...]. The array form gets executed in order, be it functions, actions, or Handlers. The array can contain Handler objects that are then handled. 



That and args are mainly for passing in when calling a handler from a handler. If a handler already has these bound, it will use the bound ones. 

We pass in data, emitter, args, event string into the handler functions. This order was chosen in likelihood of use. The event string is needed for the .when handler to do its job. 

All of the handlers are encapsulated in a try...catch that then calls the emitter's .error method (which can be overwritten). The default will rethrow the error with more information. 


    function me (data, evObj, context, value) {
        if (evObj.stop) {
            return;
        }

        var handler = this,
            emitter = evObj.emitter,                
            actions = emitter._actions;

        value = value || handler.value;
        context = value.context || this.context || context || empty;

        try {
            if (typeof value === "string") {
                if ( actions.hasOwnProperty(value) ) {
                    emitter.log("executing action", value, evObj);
                    actions[value].execute(data, evObj, context);
                } else {
                    emitter.log("action not found", value, evObj);
                }
                return;
            }

            if (typeof value === "function") {
                emitter.log("executing function", value, evObj);
                value.call(context, data, evObj);
                return; 
            }

            if ( Array.isArray(value) ) {
                value.forEach(function (el) {
                    me.call(empty, data, evObj, context, el); 
                });
                return;
            }

            if ( typeof value.execute === "function" ) {
                value.execute(data, evObj, context);
                return;
            }   

            emitter.log("value not executable", value, evObj);

        } catch (e) {
            emitter.error(e, value, data, evObj, context);
        }

        return;
    }

[summarize]()

This tries to report the structure of the handlers. We use the property name "name" for the tag to return for any given level.

    function me (value) {
        var ret, lead;

        if (typeof value === "undefined" ) {     
            value = this;
        }

       if (typeof value === "string") {
            return "a:" + value;
        }

        if (typeof value === "function") {
            return "f:" + (value.name || "");
        }

        if ( Array.isArray(value) ) {
            ret = value.map(function (el) {
                return me.call(empty, el);
            });
            lead = value.name || "";
            return "arr: " + lead + " [" + ret.join(", ") + "]";
        }

        if ( value && typeof value.summarize === "function" ) {
            ret = me.call(empty, value.value);
            lead = value.name || "";
            return "h: "+ lead + " " + ret;
        } 

        return "unknown";

        }


[make](# "js")

This is a simple wrapper for new Handler

    function (value, context) {
        return new Handler(value, context);
    }

[doc]()

    Handlers are the objects that respond to emitted events. Generally they wrap handler type objects. 

    ### Handler types

    ### Handler methods

### Tracker

The tracker object is used to track all the data and what events are available. Controlling it controls the queue of the when emit. 

    function () {
        this.events = {};
        return this;
    }


[prototype](# "js")

THe various prototype methods for the tracker object. 

    Tracker.prototype.add = _"tracker:add";
    Tracker.prototype.remove = _"tracker:remove";
    Tracker.prototype._removeStr = _"tracker:remove string";
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
        } else if (! Array.isArray(newEvents) ) {
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

    function (byeEvents) {
        var tracker = this,
            events = tracker.events;

        if (arguments.length !== 1) {
            byeEvents = Array.prototype.slice.call(arguments);
        } else if (! Array.isArray(byeEvents) ) {
            byeEvents = [byeEvents];
        }

        byeEvents.forEach(function (el) {
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

This cancels the .when, removing the handler from all remaining events and clearing the data. 

    function () {
        var tracker = this, 
            emitter = tracker.emitter,
            handler = tracker.handler,
             keys;
        
        emitter.log("canceling tracker", tracker);

        keys = Object.keys(tracker.events);

        keys.forEach(function (event) {
            emitter.off(event, handler);
        });

        tracker.data = [];
        return tracker;
    }

[go](# "js")

This is the primary activator. 

If reset is true, then we add those events before firing off the next round. 


    function () {
        var tracker = this, 
            ev = tracker.ev, 
            data = tracker.data,
            events = tracker.events,
            emitter = tracker.emitter;


        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
            emitter.emit(ev, data, tracker.timing); 
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

[example]()

    // wait for 5 emits of some before saying great
    var t = emitter.when([["some", 5]], "great");
    //add in waiting for neat
    t.add("neat");
    // check to see if it is ready to go. it isn't so nothing happens
    t.go();
    // remove 3 wait events for some
    t.remove([["some", 3]]);
    // gives current events for tracking
    console.log(t.events); 
    //emit event neat which removes it from waiting list.
    emitter.emit("neat");
    // emit some, bringing down to just waiting for one
    emitter.emit("some");
    // emit remaining "some" which triggers emission of "great"
    emitter.emit("some");
    // emit "great" again
    t.go();
    // wait for "neat"
    t.add("neat");
    //nothing happens
    t.go()
    //emit neat, "great" gets emitted
    emitter.emit("neat");
    t.add("neat");
    //removal triggers "great" to be emitted
    t.remove("neat");
    // back to starting list of events
    t.reinitialize();
    // cancel tracking
    t.cancel();

## README

The readme for this. A lot of the pieces come from the doc sections.

    ## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

    _"introduction:doc"

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
    _"emit:doc"

    ---
    <a name="when"></a>
    _"when:doc"

    ---
    <a name="on"></a>
    _"on:doc"

    ---
    <a name="off"></a>
    _"off:doc"

    ---
    <a name="once"></a>
    _"once:doc"

    ---
    <a name="stop"></a>
    _"stop:doc"

    ---
    <a name="action"></a>
    _"action:doc"

    ---
    <a name="scope"></a>
    _"scope:doc"

    ---
    <a name="events"></a>
    _"events:doc"

    ---
    <a name="handlers"></a>
    _"handlers:doc"

    ---
    <a name="error"></a>
    _"error:doc"

    ---
    <a name="log"></a>
    _"makelog:doc"

    ### Object Types

    * [Emitter](#emitter). This module exports a single function, the constructor for this type. It is what handles managing all the events. It really should be called Dispatcher. 
    * [Handler](#handler) This is the object type that interfaces between event/emits and action/functions. 
    * [Tracker](#tracker) This is what tracks the status of when to fire `.when` events.

    ---
    <a name="emitter"></a>
    _"constructor:doc"

    ---
    <a name="handler"></a>
    _"handler:doc"

    ---
    <a name="tracker"></a>
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


## TODO

Redo all examples. Writing the command parser for event when might be instructive. 

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
        "literate-programming" : "~0.7.2",
        "tape": "~2.5.0"
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

---

Decided to jettison all the myth/data stuff and the passin object. Instead, events emit data (a single object) and the context of arguments is either provided by the handler or is the empty object. The second argument is the event Object which should have the current scope too. The event definitions will not have any distinct data -- this can be put in the handler's context if needed. 

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
    *.swp

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
