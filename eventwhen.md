# [event-when](# "version: 0.6.0-pre| jostylr")

This is my own little event library. It has most the usual methods and conventions, more or less. 

But the one feature that it has that I am not aware of in other libraries is the ability to fire an event after other events have fired. 

As an example, let's say you need to read/parse a file and get some data from a database. Both events can happen in either order. Once both are done, then the message gets formed and sent. This is not handled well in most event libraries, as far as I know. But what if we had a method called `emitter.when("all data retrieved", ["file parsed", "database returned"])` which is to mean to block the event "all data retrieved" until both events "file parsed" and "database returned" have fired. 

Other notable differences include simple scoping of events and actions. 

Scoping of an event will fire only the handlers associated with that scope and the global event. So we can have monitors or general actions for the overarching level and then we can have particular actions at the scoped level. 

Actions are a string with associated functions or handler to fire. This is a great way to have a running log of event --> action. 

Please note that no effort at efficiency has been made. This is about making it easier to develop the flow of an application. If you need something that handles large number of events quickly, this may not be the right library. 

## Files

The file structure is fairly simple. 

* [index.js](#main "save:|jshint") This is the node module entry point and only relevant file. It is a small file.
* [examples/full.js](#full-example "save: |jshint")
* [README.md](#readme "save: | clean raw ") The standard README.
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
        this.count = 0;
        this.resumeCount = 0;
        this.name = "";

        this.resume = this.resume.bind(this);
        this.next.max = 1000;

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    EvW.prototype.on = _"on";
    EvW.prototype.emit = _"emit";
    EvW.prototype.later = _"later";
    EvW.prototype.off = _"off";
    EvW.prototype.stop = _"stop";
    EvW.prototype.resume = _"resume";
    EvW.prototype.when = _"when";
    EvW.prototype.once = _"once";

    EvW.prototype.next =  _"next";
    EvW.prototype.nextTick =  _"next tick";

    EvW.prototype.log = function () {}; //noop stub
    EvW.prototype.makeLog = _"log";
    EvW.prototype.events = _"event listing";
    EvW.prototype.handlers = _"handlers for events";
    EvW.prototype.action = _"name an action";
    EvW.prototype.scope = _"name a scope"
    EvW.prototype.makeHandler = _"handler:make";
    EvW.prototype.error = _"error handling";

### Emission

This function is the core of both emit and later. 

First it gets an array of the various scope level events and loads their context objects. Then we create an array from that, with the most specific event first, that loads up the handlers for each event and gets ready to put the 

    function (ev, data, q, action) {
        var emitter = this, 
            sep = emitter.scopeSep;

        var scopes = ev.split(sep);

        emitter.count += 1;

        var contexts = {}; 

        var lev = "";
        scopes = scopes.map(function (el) {
            lev += (lev ? sep + el : el);
            contexts[lev] = emitter.scope(lev);
            return lev;
        });

        var evObj = {
            ev : ev,
            scopes : scopes, 
            count : emitter.count,
            contexts : contexts,
            q : q
            action : action
        };

        var evObj.events = scopes.
            slice(). 
            reverse(). 
            map(function (el) {
               var h = emitter._handlers[el] || [];
               return [el, data, [].concat(h), evObj];
            }); 


        emitter[q][action](events.pop());

        this.next(this.resume());
    }


### Emit

This will emit an event and fire its handlers immediately. If Event A emits Event B, then B's handlers should all fire before the rest of Event A does. To make sure of this, we unshift the queue of handlers waiting. 

Given an event string, we run through the handlers, passing in the data to construct the array to be added to the queue. 

    function (ev, data) {
        var emitter = this;
        emitter.log("emitting", ev, data);
        emitter._emit(ev, data, "_queue", "unshift");
        return emitter;
    }

[doc]() 

    ---
    <a name="emit" />
    ### emit(str ev, obj data) --> emitter

    Emit the event immediately.

    __arguments__

    * `ev`  A string that denotes the event. 
    * `data` Any value. It will be passed into the handler. 

    __return__

    The emitter for chaining. Note that the event and its .emit descendants will all be dealt with before the return statement is executed. 

    __scope__ 
    Note that if ev contains the [event separator](#event-separator) then it will be broken up into multiple events, each one being emitted. The order of emission is from the most specific to the general (bubbling up). 

    To stop, the bubbling, clear the `evObj.events` array. 

    To modify the later events to emit immediately or later, change `evObj.q` and `evObj.action`. 

        _":example"

[example]()

    // event with no data 
    emitter.emit("no data passed in");
    // plain event using data to say what happened
    emitter.emit("got data", {dog : "fifi"});
    // scoped event to have it passed around, `got data:dogs` called first, then `got data`
    emitter.emit("got data:dogs", ["fifi", "barney"]);
    // data need not be an object
    emitter.emit("got a string", "hey there");

### Later

This pushes the event, data, and handlers on the waiting queue. The boolean first allows for placing the emit at the head of the line. 

We also attach the handlers here. 
 
    function (ev, data, first) {
        var emitter = this;
        if (first) {
            emitter.log("queuing first", ev, data);
            emitter._emit(ev, data, "_waiting", "unshift");
        } else {
            emitter.log("queuing last", ev, data);
            emitter._emit(ev, data, "_waiting", "push");
        }
        return emitter;
    }

    function (ev, data, first) {
        var emitter = this, 
            sep = emitter.scopeSep;

        emitter.log(emitter.name + " queuing: " + ev, arguments);

        var scopes = ev.split(sep);

        data = data || {};
        emitter.count += 1;

        var contexts = {}; 

        var lev = "";
        scopes = scopes.map(function (el) {
            lev += (lev ? sep + el : el);
            contexts[lev] = emitter.scope(lev);
            return lev;
        });

        var record = {
            ev : ev,
            scopes : scopes, 
            count : emitter.count,
            contexts : contexts
        };

        var type = (first ? "unshift" : "push");


        scopes.forEach(function (el) {
            var h = emitter._handlers[el] || [];
            emitter._waiting[type]([el, data, [].concat(h), record]);
        });

        this.next(this.resume());

        return emitter;
    }


[doc]()

    * `emitter.later(str ev, obj data, bool first) --> emitter`. This will queue the handlers associated with the event ev string. The data object gets passed into the handler as does ev.  

        Note that ev could be a scoped event. See [scopes](#scopes).

        It returns the emitter for chaining. Note that the events will not be handled before the emitter is returned. 

        ```
        // the events give the order. Note all are queued before any event is handled
        var data = {enters: "dog"}
        emitter.later("third", data);
        emitter.later("second", data, true);
        emitter.later("fourth", data);
        emitter.later("first", data, true);
        ```

### When

This is a key innovation. The idea is that once this is called, a handler is created that attaches to all the listed events and takes care of figuring when they have all called. 

When all the events have fired, then `ev` fires. This should be of a handler type object. Strings are actions or events, depending on if they exist in either object. 

The return is the tracker which contains all things that might need to be accessed. It also contains the remove methods to cancel the `.when`.

As each event fires, this handler merges in the data object to the existing data. It also stores the original data object in _archive[event name] = ... in the data object passed to the event for posterity, log recordings, and hacking. 

The third argument is an object of options: 

* that Will be the context for functions fired from ev
* args Will be the arguments passed to such functions
* timing Is the timing passed to emitting events
* reset Should the .when parameters be reset to the initial state once fired?

All options are optional.

Emitting scoped events will count as a firing of the parent event, e.g., `.when([["button", 3], "disable")` will have `.emit("button:submit")` remove one of the button counts. But `.emit("button"` will not count for any `.when("button:submit")`. 


    function (events, ev, options) {    

        var emitter = this, 
            str;    
        options = options || {};

        if (typeof ev === "string") {
            str = ev;
        } else if (ev) {
            str = ev.name || "";
        } else {
            str = "";
        }

        emitter.log(".when loaded to fire "+ str, events);

        var tracker = new Tracker();

        tracker.event = new Handler(ev, options);
        tracker.emitter = emitter;
        tracker.timing = options.timing;
        tracker.reset = options.reset || false;
        tracker.original = events;

        var handler = new Handler (function (data, emitter, args, fired) {
            tracker.addData(data, fired); 
            return tracker.remove(fired);
        });


        handler.tracker = tracker;

        tracker.handler = handler; 

        tracker.add(events);

We return the tracker since one should use that to remove it. If you want the handler itself, it is in tracker.handler. It just seems more natural this way since the manipulations use tracker. 

        return tracker;
    }

[doc]()

    * `.when([fired events], Handler,  options ) --> tracker` This will track the firing of events. When all the events have fired, then the Handler gets fired. 

        The first argument can be a string for firing after a single event. But most of the time it should be an array of events and/or numbered events ( an array consisting of [event, number of times, bool first] ). Numbered events allows for counting down a certain number of times before acting. Ordering of the fired events is ignored.

        The second argument can be any [Handler-type](#handler-object). In particular, it can be an action string, an event string, a function, or a Handler consisting of those things.

        The data object that is given to the Handler is constructed out of the data of the fired events. In particular, each data object is merged with the later ones overwriting any common keys. All of the data objects are stored in the special key `_archive`.
            
        The options argument has the following useful keys: 

        * `that` Will be the context for functions fired from the Handler. It has no effect for emitted events. 
        * `args` Will be the arguments passed to any functions firing. It has no effect for emitted events. 
        * `timing` Is the timing passed to emitting events. later and firstLater trigger .later and .later(...true),  respectively. No timing or anything else triggers .emit
        * reset Should the .when parameters be reset to the initial state once fired? 

        This method returns a [tracker object](#tracker-object).

        ```
        //have two events trigger the calling of action compile page
        emitter.when(["file read:dog.txt", "db returned:Kat"], "compile page");
        //have two events trigger the emitting of all data retrieved
        emitter.when(["file read:dog.txt", "db returned:Kat"], "all data retrieved:dog.txt+Kat");
        ```


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
                        archive[str] = [];
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
        return tracker.go();
    }
    
[remove string](# "js")

This is mainly for use with the `.off` method where the handler has already been removed from the event. This takes in just a string and removes the event entirely from the events object. It then runs `go` to see if emit time is ready.

    function (ev) {
        var tracker = this;

        delete tracker.events[ev];

        return tracker.go();
    }

[add data](# "js")

When an event fires, that data gets merged in with all previous data for the emitWhen. We also keep a record of it in the `_archive` of the  data object. 


    function (eventData, event) {
        var tracker = this,
            data = tracker.data,
            key;

        for (key in eventData) {
            if (key !== "_archive") {
                data[key] = eventData[key];
            }
        }

        if (data._archive.hasOwnProperty(event) ) {
            data._archive[event].push(eventData);
        } else {
            console.log(event + " not in archive");
            //console.log(tracker);
        }



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
            cont = true;


        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
            cont = ev.execute(data, tracker.emitter, "emitWhen handler called");
        }

        return cont;
    }


### On

It takes an event (a string) and a Handler or something that converts to a Handler.  To have segments that are always in order, use a Handler with an array value of handler-types that will be executed in order.


"first" should be rarely used hence last. Pass TRUE in that slot; if that and args are not needed, pass in null. 


    function (ev, f, that, args, first) {
        var emitter = this,
            handlers = emitter._handlers;

        f = new Handler(f, {that: that, args:args} ); 

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

    function (value, options) {
        if (value instanceof Handler) {
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

An action is an instanceof Handler. So we call its execute method. Hope it is not self-referential...but if it is is the countExecute variable should stop infinity in its tracks.

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

For the .later command, we use a waiting queue. As soon as next tick is called, it unloads the first one onto the queue, regardless of whether there is something else there. This ensures that we make progress through the queue. Well, assuming there is a next tick. 

     function () {

        var q, f, ev, data, cont, cur, scopes,  
            emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting; 

        // emitter.log("events on queue", queue.length+waiting.length, queue, waiting);
        emitter.countExecute = 0;
        emitter.resumeCount += 1;

        if (queue.length >0) {
            cur = queue[0];
            ev = cur[0];
            data = cur[1];
            q = cur[2];
            scopes = cur[3];
            
            if (q.length === 0) {
                // put in scope check
                
                queue.shift();            
            }
            f = q.shift();
            if (f) {
                emitter.log(emitter.name + " firing "+ f.name + " for " + ev + "::" + which.count);
                cont = f.execute(data, emitter, ev, which);
                _":do we halt event emission"
                emitter.log(emitter.name + " firED " + f.name+ " for " + ev + "::" + which.count);
            }
            this.next(this.resume());
        } else if (waiting.length > 0) {
            emitter.nextTick(function () {
                if (waiting.length > 0)  {
                    queue.push(waiting.shift());
                }
                emitter.next(emitter.resume());
            });
        } else {
            emitter.log("all emit requests done");
        }

    }


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

    function (ev, context) {
        var emitter = this;

        if (arguments.length === 1) {
            return emitter._scopes[ev];
        }

        if ( (arguments.length === 2) && (handler === null) ) {
            delete emitter._scopes[ev];
            emitter.log("Removed scope of event " + ev);
            return ev;
        }
        
        var scope = context;

        if (emitter._scopes.hasOwnProperty(ev) ) {
            emitter.log("Overwriting scope " + ev);
        }

        emitter._scopes[ev] = scope;

        return ev;
    }

[doc]()

    * `.scope(str ev, context) --> ev` This manages context for the scoped event ev. 

        * Given event ev and anything context, the context will be associated with the event ev. 
        * `.scope(str ev) --> context` Given just event ev, its associated context is returned. 
        * `.scope(str ev, null) --> ev` Given event ev and null as second argument, the context for ev is removed. 

        ```
        // stores reference to button element
        emitter.scope("button:submit", submitButton);
        // returns submitButton
        emitter.scope("button:submit");
        //overwrites submitButton
        emitter.scope("button:submit", popupWarning);
        //removes scope button:submit
        emitter.scope("button:submit", null);
        ```

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

 ##event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

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

### Version 0.5.0 Thoughts

I have made a mess of the emit events. So here is the new paradigm. `.emit` is equivalent to a function call. It gets called immediately and its sequence of emits is followed as if they are function calls. The hope is that all the handlers of an event emitted from within an emitted event sequence wil be done completely before the rest of the original emit's handlers fire. 

`.later` is asynchronous mode. It will emit the events, in the order queued, at the next tick. Each one happens after a next tick. So the entire sequence from one emit event will happen before the next `.later` is called. I think I will have an optional parameter to specify push vs unshift behavior with default being push. 

Also, adding use of emitter.name in logs as well as numbering the emits called for a given event. The string form for a handler will also lead to a log event if no action/event fits. 

### Version 0.4.0 Thoughts

The idea is to create an action sentence that invokes the handler. So we attach the sentence to the event and then stuff happens to that. The handler can be a function or it could be an array of functions, etc. The point of invocation is when the sentence is used as a key to get the handler. So this allows dynamism which could be good, could be bad. The hard work, I think, is to rewrite the handler calling to be abstracted out to another level. I probably need to introduce an object of type handler. 

## gitignore

We should ignore node_modules (particularly the dev ones)

    node_modules

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
