## Constructor

This manages an event emitter.

We set some variables; see the doc section. 

We bind `looper` which is the execution loop to the instance since it will be
passed in without context via setImmediate.

There are a couple of default actions, one for caching events and one for
dealing with `.when`. They have a leading `_` to denote that
it is kind of private. 

    function () {

        this._handlers = new Map();
        this._scopes = new Map();
        this._actions = new Map();
        this._actions.set("_cache", _"cache function");
        this._onceCache = new Map();
        this._queue = [];
        this._monitor = [];
        this._looping = false;
        this.loopMax = 1000;
        this.loop = 0;
        this.emitCount = 0;
        this._cache = {};
        this.initialOrdering = false;  // for .when tracker behavior

        this.looper = this.looper.bind(this);

        this._label = "emitter";

        return this; 
    }

[prototype]()

The various prototype methods on the event emitter. 

     
    EvW.prototype._emit = EvW.prototype.emit = _"emit";
    EvW.prototype._emitWrap = _"monitor:wrapper";
    EvW.prototype.monitor = _"monitor";
    EvW.prototype.scope = _"scope";
    EvW.prototype.scopes = _"scopes";
    
    EvW.prototype.on = _"on";
    EvW.prototype.off = _"off";
    EvW.prototype.once = _"once";
    EvW.prototype.storeEvent = _"store event";
    EvW.prototype.decrement = _"decrement";
    EvW.prototype.when = _"when";
    EvW.prototype.whenHandler = _"handling when";
    EvW.prototype.endStringParser = _"end string parser";
    EvW.prototype.lastCharListen = _"last character meanings for listening";
    EvW.prototype.lastCharEmit = _"last character meanings for emitting";
    EvW.prototype.cache = _"cache";

    EvW.prototype.looper = _"looper";
    EvW.prototype.nextTick =  _"nextTick";
    EvW.prototype.stop = _"stop";

    EvW.prototype.log = function () {}; //noop stub
    EvW.prototype.makeLog = _"makeLog";
    EvW.prototype.events = _"events";
    EvW.prototype.handlers = _"handlers";
    EvW.prototype.action = _"action";
    EvW.prototype.actions = _"actions";
    EvW.prototype.error = _"error";
    EvW.prototype.queueEmpty = function () {}; // noop stub

    EvW.prototype.filter = filter;
    EvW.prototype.decycle = decycle;
    EvW.prototype.serial = serial;


[doc]()

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


## Emit

This function emits the events.

We will load the event onto the queue or waiting list, depending on the
timing provided. We create an object, `evObj` that will be passed around as
the second argument into handlers. It will contain the deconstruction of the
scopes along with their scope objects. It also creates a copy of the
handlers array for each of the scope levels. 

When ready, we load the events and call the loop (which exits immediately if
we are already in the loop). 

    function (ev,  data) {
        const emitter = this; 
        let evObj;

        /*
        if (typeof ev !== "string") {
            emitter.error("event string is not a string", [ev, data]); 
            return;
        }
        */

        _":setup event object"

        emitter._queue.push(evObj);
        
        emitter.log("emit", ev, data);

        if (emitter._looping === false) {
            emitter.looper();
        }

        return emitter;
    }


[doc]() 


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

        _":example"

[example]()

    emitter.emit("text filled", someData);
    emitter.emit("general event:scope", data);
    emitter.on("general event", "respond with scoped target~");
    emitter.emit("general event:scope", data);

[setup event object]()

This takes the event, splits off the scope, finds the handler(s), and gets
them. We want to make sure that we have all the handlers that are there at the
time of the emitting. 

The handlers could be the full event+scope which get executed first. 

    evObj = [ev, data]; //the emit arguments come first.
    let colIndex = ev.indexOf(":");
    let actions;
    const handlers = emitter._handlers;
    if (colIndex === -1) {
        evObj.push(ev, null);
        actions = handlers.get(ev);
        if (actions) {
            evObj = [ev, data, '',
                emitter.decrement(actions.slice(0)) 
            ];
        } else {
            emitter.log("emit without action", ev, data);
            return emitter;
        }
    } else {
        const gen = ev.slice(0,colIndex);
        const scope = ev.slice(colIndex+1);
        const specifics = handlers.get(ev);
        const generals = handlers.get(gen);
        if (specifics && generals) {
            evObj = [ev, data, scope,
                emitter.decrement(specifics.slice(0), ev).
                concat(emitter.decrement(generals.slice(0), gen))
            ];
        } else if (specifics) {
            evObj = [ ev, data, scope, 
                emitter.decrement(specifics.slice(0), ev)
            ];
        } else if (generals) {
            evObj = [ev, data, scope, 
                emitter.decrement(generals.slice(0), gen)
            ];
        } else {
            emitter.log("emit without action", ev, data);
            return emitter;
        }
    }


### Scope

This manages the scopes object in a simple functional interface. One can
directly access the scopes object, but this allows for a more unified access
that can also be debugged easily enough. 


    function (key, obj, tobj) {
        const emitter = this;

        if (arguments.length === 0) {
            return Array.from(emitter._scopes.keys());
        }

        
        if (arguments.length === 1) {
            return emitter._scopes.get(key);
        }

        if ( obj === null ) {
            emitter.log("deleting scope event", key);
            obj = emitter._scopes.get(key);
            emitter._scopes.delete(key);
            return obj;
        }

For two arguments, first being true, we grab the scope and/or create one. A
third argument in this case will be assumed to be the desired new object and
returns it. 

A newly created scope will be a plain object with no properties. Chose this
over a Map to ensure that we can do `s.c` for accessing it; this is about
convenience of code. 

        if (key === true) {
            key = obj;
            obj = emitter._scopes.get(key);
            if (typeof obj === 'undefined') {
                if (typeof tobj !== 'undefined') {
                    emitter._scopes.set(key, tobj);
                    return tobj;
                } else {
                    obj = Object.create(null);
                    emitter._scopes.set(key, obj);
                }
            }
            return obj;
        }

        if (emitter._scopes.has(key) ) {
            emitter.log("overwriting scope", key);
        } else {
            emitter.log("creating scope", key, obj);
        }

        emitter._scopes.set(key, obj);

        return emitter;
    }

[doc]()

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

        _":example"

[example]()

    emitter.scope("bob", {bd: "1/1"});

    emitter.scope("bob") === {bd:"1/1"};

    emitter.scope() === ["bob"];



### Looper

This implements the looping over the queue. It is designed to avoid recursive
stack calls. To do this, we keep track of whether we are looping or not in the
`emitter._looping` variable. This should only get called if that flag is
false. 

For example, A is emitted and starts the loop. A emits B which then sees that
the loop is active and does not call the loop. B does get queued and after the
first handler of A finishes, the queue is consulted again.  This continues
progress through the queue. We use either setTimeout (browser) or setImmediate
(node) to allow for other stuff to happen in between each 1000 calls. This is
amusingly called nextTick. 

As looper is called without context, we have bound its function to the
emitter instance. 

    function () {
        let emitter = this,
            queue = emitter._queue,
            loopMax = emitter.loopMax,
            self = emitter.looper;
           

        if (emitter._looping) {
            return;
        }


        emitter._looping = true;

        while ( (queue.length) && (emitter.loop < loopMax ) ) {
            _"act"
            emitter.loop += 1;
        }

        emitter._looping = false;

        if (queue.length) {
            emitter.log("looping hit max", [emitter.loop, queue]);
            emitter.loop = 0;
            emitter.nextTick(self);
        } else {
            emitter.queueEmpty();
        }

        return emitter;

    }


### Act

This is to handle a single event on the event queue. 

Event object is of the form `[event, scope, data, handlers]`

    
    let evObj = queue.shift();
    emitter.log('start executing emit', evObj);
    let actions = evObj.pop();
    
    let action; 
    while ( ( action = actions.shift() ) ) {
        emitter.log("will execute handler", action, evObj);
        //evObj = [ev, data, scope]
        action.execute(evObj[1], evObj[2]);
        emitter.log("done executing handler", action, evObj);
    }
    emitter.log('done with emit', evObj);
    

### NextTick

The cede control function -- node vs browser.

    (typeof setImmediate !== "undefined" ) ? setImmediate
        : (function (f) {setTimeout(f, 0);})
    

## On

It takes an event (a string) and an action to associate event with action. It
can also take in a context string, an anonymous function, and an object. Those
three can be in any order as their types dictate what they are used for. The
context string is a scope to access, the object is a potential scope, and the
function is what would be executed to call. 


    function (ev, action, f, context) {
        const emitter = this;

        _":check for strings"
        _":switch variables"

        const handlers = emitter._handlers;

        let handlerArr = handlers.get(ev);
        if (handlerArr) {
            _":check for repeat event action assignment"
        } else {
            handlerArr = [];
            handlers.set(ev, handlerArr);
        }

        const handler = new Handler(action, f, context, emitter); 
        handler.event = ev;
        handler.emitter = emitter;

        handlerArr.push(handler);

        emitter.log("on", ev, action, f, context); 

        return handler;

    }

[doc]() 

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


[check for strings]()

Need strings for events and actions.

    if (typeof ev !== "string") {
        emitter.error("bad event for 'on'", ev, action);
        return;
    } else if (typeof action !== "string") {
        emitter.error("bad action for 'on'", ev, action);
    }

[switch variables]()

It may be the case that a function is not passed in despite a context being
passed in (as in the action gets the function and the on has the context
specified) or the context and function might be switched up. 

We switch them whenever f is passed in and is not a function. A null will get
switched. 

    if ( (typeof f !== 'undefined') && (typeof f !== "function")) {
        let temp = f;
        f = context;
        context = temp;
    }

[check for repeat event action assignment]()

We do not want the same event and action pairing to occur. 

    let i, n = handlerArr.length; 
    for (i=0; i < n; i +=1) {
        if (handlerArr[i].fullAction === action) {
            emitter.log("repeat event-action pair for on", 
                ev, action);
            return handlerArr[i];
        }
    }


[wrapper]() 

If the action ends in `~` (scope as object) or `.`  (scope as string), then we
wrap the function to invoke this so that simple setups flow faster. The
variable `handler.scopeObj` is set true, false, respectively. 
        
    function wrapper (data, target, emitter, context, evObj, raw) {
        let handler = this;
        if (typeof target === 'undefined') {
            if  (handler.scopeObj) {
                target = emitter.scope(true, evObj[4]);
            } else {
                target = evObj[4];
            }
        }
        emitter.log("executing action", handler.action, data, target, evObj);

        g = g || raw.f;
        g.call(handler, data, target, emitter, context, evObj);
    }



### Once

This attaches to a handler the count to be decremented. When the count reaches
0, the handler is removed. 

If present, n, needs to be first. 

    function (ev, action, n, f, context) {
        const emitter = this;
        let handler;

        if (typeof n === "number") {
            handler = emitter.on(ev, action, f, context);
            if (handler) {
                handler.count = n; 
                emitter.log("once", ev, action, n);
            }
        } else {
            handler = emitter.on(ev, action, n, f);
            if (handler) {
                handler.count = 1;
                emitter.log("once", ev, action, n);
            }
        }

        _":check cache"
        
        return handler; 
    }

[doc]()

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

        _":example"


[example]()

    // talk with bob just once when event "bob" happens
    // this will be the object brief
    emitter.once("bob", "talk with bob", brief);
    // talk with jack three times, using brief each time
    emitter.once("jack", "talk with jack", 3, brief);

[check cache]()

 It is possible for a once method (defined just once) to be defined after the
 event is emitted and the cache will then be there to fire it. This short circuits the rest. 

 The handler.execute method is how we call things and it needs an event
 object, some of which is not needed as we are are avoiding the queue. 

 We used up as much of the handler as the cache has, up to the limit of the
 count. 

We need to check for a tilde first. 

    if (ev[ev.length-1] === '~') {
        ev = ev.slice(0,-1);
    }
    let cache = emitter._onceCache.get(ev);
    if (cache) {
        let n = Math.min(cache.length, handler.count);
        let colIndex = ev.indexOf(":");
        colIndex = (colIndex === -1) ?  ev.length : colIndex;
        let scope = ev.slice(colIndex);
        let i;
        for (i = 0; i < n; i+=1) {
            handler.count -=1;
            handler.execute(cache[i][0], scope, emitter, cache[i]);
        }
        if (handler.count === 0) {
            emitter.off(ev, handler);
            return;
        } else {
            return handler;
        }
    }




### Off

This removes handlers. The nowhen boolean, when true, will leave the when
handlers on the when events. This effectively blocks those events from
happening until some manual reworking on the event. Since the no argument
function wipes out all handlers, period, we do not need to worry about nowhen.

!!! extend action to filter type and work through handler action strings. This
could, for example, remove an entire set of actions that have a certain tag in
the action name.


    function (events, action, nowhen) {

        const emitter = this; 
        const handlers = emitter._handlers;
        var h, f;

        if ( (events == null) && (action == null) ) {
            handlers.clear();
            emitter.log("all handlers removed from all events");
            return emitter;
        }

        if (events == null) {
            events = Array.from(handlers.keys());
        } else if (typeof events === "string") {
            events = [events];
        } else if (typeof events === "function") {
            events = Array.from(handlers.keys()).filter(events);
        } else if (events instanceof RegExp) {
            events = Array.from(handlers.keys()).filter(
                function (el) {
                    return events.test(el);
            });
        }

        if ( typeof action === "boolean") {
            nowhen = action;
            action = null;
        }

        let removed = [];
        if (typeof action === 'string') {
            events.forEach( function (ev) {
                _":remove handler"
                emitter.log("handler for event removed", ev, action);
            });
            return emitter;    
        } else if (action) { //presuming a handler to match
            events.forEach( function (ev) {
                _":remove handler | sub handler.action, handler"
                emitter.log("handler for event removed", ev, action.action);
            });
            return emitter;        

        }

        events.forEach( function (ev) {
            if (nowhen === true) {
                handlers.delete(ev);
                emitter.log("removed handlers on event ignoring when", ev); 
                return emitter;
            } else {
                _":remove handlers checking for when handlers"
                emitter.log("removing all handlers on event", ev);
            }            
        });
        
        return emitter;
    }          
 

[remove handler]()

This will remove all handlers that are or contain the passed in action. 

We try to maintain the same array for the handlers. Hence the forEach and
splicing instead of filter. Splicing during the first forEach will result in
skipping elements, etc., so we simply record the locations, in reverse order
to not have a shift, and splice from there. 

Added the ability to call `off` method on handler which is a way to have an
instant action (setting up a new listener, for example). This is to deal with
the fact that the `once` is removed before actually calling the handler due to
the events being queued instead of called upon. Want to make sure listeners
are always active when needed. 

    if (handlers.has(ev) ) {
        let place = [];
        let arr = handlers.get(ev);
        arr.forEach( (handler, ind) => {
            if (handler.action === action ) {
                removed.push(handler);
                place.unshift(ind);
            }
        });
        place.forEach( ind => arr.splice(ind, 1));
        if (arr.length === 0) {
            handlers.delete(ev);
        }
    }
    if (nowhen !== true)  {
        removed.forEach(function (el) {
            el.removal(ev, emitter);
        });
    }
    removed.forEach(function (el) {
        el.off();
    });


[remove handlers checking for when handlers]()

The main issue here is removing .when trackers.
    
    h = handlers.get(ev);
    while (h.length > 0) {
        f = h.pop();
        f.removal(ev, emitter);
    }
    handlers.delete(ev);


[doc]()

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

        _":example"

[example]()

    // removes action `empty trash` from "full:bob"
    emitter.off("full trash:bob", "empty trash");
    // removes all handlers to all events with :bob as last 
    emitter.off(/\:bob$/);
    // removes all listed events that have action "whatever"
    emitter.off(["first", "second"], "whatever");
    // function filter
    emitter.off(function (ev) { return (ev === "what");}, "action now");


### Decrement

This decrements the once handlers and removes them if 

    function (arr, ev) {
        const emitter = this;
        const n = arr.length;
        if (n) {
           let i;
            for (i = 0; i<n; i +=1) {
                if (arr[i].hasOwnProperty('count') ) {
                    arr[i].count -=1; 
                    if (arr[i].count === 0) {
                        emitter.off(ev, arr[i]);
                    }
                }
            }
        }
        
        return arr; 
    
    }


[doc]()

    some docs

### Store Event

This does a basic caching of events. It is a handler for it and stores
whatever is needed to call it again. 



    function (ev, off) {
        const emitter = this;
        if (off !== false) {
            emitter.on(ev, "_cache:*");
        } else {
            emitter.off(ev, "_cache");
            emitter.scope("_cache").delete(ev);
        }      

        return emitter;
    }


 [doc]() 

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

        _":example"

[example]()

    emitter.storeEvent("text filled");
    emitter.once("text filled", function (data) {
        //do something
    });


#### Cache Function

This handles a cache event. 

    function (data, ev, scope, emitter, context, evObj) {
        let cache = context.get(ev);
        if (!cache) {
            cache = [];
            context.set(ev, cache);
        }
        cache.push(data, evObj);

        return emitter;
    }



## Action

This is for storing Handler type objects under a name string, generally some
active description of what is supposed to take place. The Handler type can be
anything that converts to Handler. 

If just one argument is provided, then the handler is returned. 

If two arguments are provided, but the second is null, then this is a signal
to delete the action. 

The handler should be a primitive type, namely an object with a function and
possibly context information. 


    function (name, f, context) {
        const emitter = this;
        const actions = emitter._actions;

        if (arguments.length === 0) {
            return Array.from(actions.keys());
        }

        if (typeof name !== 'string') {
            emitter.log("action name needs to be a string", name, f, context);
        }

        if (arguments.length === 1) {
            return actions.get(name);
        }

        if ( (arguments.length === 2) && (f === null) ) {
            f =  actions.get(name);
            actions.delete(name);
            emitter.log("removed action", name);
            return f;
        }

        if (typeof f !== 'function') {
            emitter.error("named action must have function", name, f, context);
            return emitter;
        }
        

        if (actions.has(name) ) {
            emitter.log("overwriting action", name, f, context,
                actions.get(name));
        } else {
            emitter.log("creating action", name, f, context); 
        }

        let contextStr;
        let i = name.indexOf(':');
        if (i !== -1) {
            contextStr = name.slice(i+1); 
            if (contextStr[0] === '*') {
                name = name.slice(0, i);
                contextStr = name;
            }
        }

        let o = { f:f};

        if (contextStr || (contextStr==='')) {
            o.contextStr = contextStr;
            if (typeof context === 'undefined') {
                context = emitter.scope(true, contextStr);
            }
        }
        o.context = context;
        
        if (typeof f === 'function') {
      
Making sure function is named. Note that if context is overwritten in the
handler call, then the context string here will be misleading. Presumably, a
named context will not be overwritten, only an object one (maybe) and the
object will not be part of the name. 

            Object.defineProperty(f, 'name', {
                value:(f.name||'') + ":" + name, 
                configurable:true});
        }

        actions.set(name, o);

        return emitter;
    }


[doc]() 

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

### Handler

This is where we define handlers.

The idea is that we will encapsulate all handlers into a handler object.
When a function or something else is passed into .on and the others, it will
be converted into a handler object and that object gets returned. The lead
argument should be the action string. This is mandatory. The rest is an
options argument which allows us to setup insulated handler instances.
Otherwise, the action string gets used to look up the handler at the time of
the emit. 

The handler may be called in various ways: 

* With the function f. We call this and do not look up any actions. This may
  or may not have a context in the action or separately passed in. 
* No function f. Then this is an action. Still might have a given context. 

---

    function (fullAction, f, context, emitter) {
        const handler = this;
        let i, contextStr, action;
        handler.fullAction = fullAction;
        if ( (i = fullAction.indexOf(":")) !== -1) {
            action = handler.action = fullAction.slice(0,i);
            contextStr = handler.contextStr = fullAction.slice(i+1);
            if (contextStr === '*') {
                contextStr = action;
            }
            if (typeof context === 'undefined') {
                context = emitter.scope(true, contextStr);
            }
        } else {
            handler.action = fullAction;
        }
        handler.context = context;
        handler.emitter = emitter;
        
        if (typeof f === 'function') {
            handler.f = f;
      
Making sure function is named 

            Object.defineProperty(f, 'name', {
                value:(f.name||'') + ":" +
                    fullAction, configurable:true});

        }

        return handler;
    }

[prototype]()

The prototype object.

* execute Executes the handler
* removal Removes any of the handler bits that are attached to .when
  trackers.

---
    Handler.prototype.execute = _"execute"; 
    Handler.prototype.removal = _"removal";
    Handler.prototype.off = _"calling off";

[doc]()

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
    _"execute:doc"
    
    ---
    <a name="removal"></a>
    _"removal:doc"
    ---

    <a name="off"></a>
    _"off:doc"


#### Removal

This is to remove the tracking of a .when event in conjunction with the .off
method.

    function me (ev, emitter) {
        let handler =  this;

        if ( handler.hasOwnProperty("tracker") ) {
            handler.tracker._removeStr(ev);
            emitter.log("untracked", ev, handler.tracker, handler);
            return ;
        }

        return;
    }

[doc]() 

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


#### Execute

Here we handle executing a handler.


We pass in data, scope, emitter, and context. We figure out what function to
call either it being in the handler or using the action lookup. 

No error catching for the function. 

We pass in raw for the call for the wrapper from handler in the instance of
scope objects (see on). 
 
    function me (data, scope) {
        
        const handler = this;
        const emitter = handler.emitter;
        const raw = emitter._actions.get(handler.action) || {};

        const f = this.f || raw.f;

        if (!f) {
            emitter.error('bad function in handler', data, scope, handler);
            return;
        }

        let context = this.context || raw.context;
        
        emitter.log("executing action", data, scope, handler);

        f.call(handler, data, scope, context);

        return;

    }

[doc]()

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

#### Calling Off

This prototype function is a no-op unless a function is passed in, in which
case it installs that function on the instance in the .off position. 

    function (f) {
        if (f) {
            this.off = f;
        }
        return;
    }

[doc]()

    #### off(f) --> void

    This does nothing if no function is passed in. If a function is passed in,
    then it installs that function in place of itself. That function will be
    called with the handler as context and is invoked as soon as a Handler is
    removed as a listener.

    A typical use case is to have f install a new listener. We do this since
    otherwise there an be a gap between event emitting, offing, and emit
    handling.

    Since the handler is the context, the event and emitter can be accessed
    from its properties. 


## When

This is a key innovation. The idea is that once this is called, a handler is
created that attaches to all the listed events and takes care of figuring
when they have all been called. 

When all the events have fired, then the given event emits with a data
object that may be a variety of things, but the default is an array  of 
all the fired event's data. 

The return is the tracker. It stops the chaining of the emitter, but the
tracker can be very useful to have. 

The tracker is responsible for tracking when to fire. It contains a list of
the events, the data emitted, and other stuff related to processing and
emitting that data when the time comes. After creating (or retrieving) the
tracker, we then add the events to it.  


    function (events, ev, scope) {
        const emitter = this;
        const output = emitter.whenOutput;
        const pipe = emitter.whenPipe;

        _":check inputs"
    

        emitter.log("adding events to listen for before emitting", 
            events, ev, scope);

        let evOpt;
        [ev, evOpt] = emitter.endStringParser(ev);

        let action = '_process event for when:'+ ev;
        let tracker = emitter.scope(ev);
        if (!tracker) {
            tracker = new Tracker (evOpt, emitter, action, events, ev);
            emitter.scope(ev, tracker);
        }

        tracker.append(events, ev); //adds to the originals
        tracker.add(events, ev);
        
        return tracker;
    }


        
[check inputs]()

The inputs should be an array of strings (events), a string, and an optional
object. 

    if (typeof events === 'string') {
        events = [events];
    } else if (! Array.isArray(events) ) {
        emitter.error('events for when must be an array or a string',
            events, ev);
        return emitter;
    } else {
        if (!events.every( a => typeof a === 'string') ) {
            emitter.error('events in array must be strings', events, ev);
            return emitter;
        }
    }

    if (typeof ev !== 'string') {
        emitter.error('emit event must be string for when', events, ev);
        return emitter;
    }
    

    
[deal with scope]()

We want to enable the option of scoping all the events to the same scope. The
convention will be that if an event ends in a ":", then we add the scope,
which is either from the options.scope or from the scope of the emitting
event. 

If there is no scope, then we remove any ending colons. To avoid this, one can
pass in `options.scope = ''` which will end up adding an empty string at the
end of the colon and preserving it all. 

    if (scope) {
        events = events.map( a => {
            return (a[a.length-1] === ':') ?
                a + scope : 
                a;
        });
    } else {
        events = events.map( a=> {
            return (a[a.length-1] === ':') ?
                a.slice(0, -1) :
                a;
        });
    }



[doc]()


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
      the incoming.  Default.
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
      emitted. Default. 
    * `&` This returns a Map of `[event, data]`. It will have the order of
      being added to `.when`. This will have the event listed in the fashion
      it was listed. That is, if there is no scope for the `.when` but was
      emitted with one, it is ignored by default though the pipe could do
      something with it as part of the data.
    * `=`, This is the same as the `,` except that if there is only one value,
      then it returns that value instead of an array.
    * `@`  This is similar to the one returning a Map, but it returns an array
      instead. 
    * `^` This will return an array of `[event, data]`, similar to `@`, but it
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

        _":example"

    emitter will automatically emit "data gathered" after third emit with
    data `[ fileobj, dbobj, null ]`

    Notice that if the event is a parent event of what was emitted, then the
    full event name is placed in the third slot. 


[example]()

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
  

### Handling When

This is where we handle when when it is called. 

The context holds all the long term data that when needs. 

    function (data, scope, context) {
        const handler = this;
        const tracker = handler.tracker;
        const {handlers, events, emitter} = tracker;
        const pipes = emitter.pipes;
        const event = handler.event;
        const obj = events.get(event);
        const piping = obj.piping;

        tracker.emits.push(event, data, scope, context);

        _":run pipes"

        _":do final prep"

        if (handler.count === 0) {
            handlers.delete(handler.event);
            tracker.go();
        }

    }


[run pipes]()

Each pipe acts on the previous value, starting with data. It can also access
scope and context. The `this` is the handler. One can get values from the
context (Tracker) and get the event from the handler, if needed. The ideal is
that they are not needed.

    let val = data;
    if (piping) {
         val = piping.reduce(function (val, pipe) {
            return (pipeMap.get(pipe) || identity).
                call(handler, val, scope, context);
        }, val);
    }


[do final prep]() 

This takes the data converted val and then does something appropriate with it,
depending on the last character. Handler, scope, context are not used in
these, but it could be useful in a more generalized setup. 

    obj.final(val, handler, scope, context);


### Last Character Meanings for listening

This defines an object which takes in a last character from the end string
parser and returns a suitable function. 

    { 
        '=' : function replace (incoming) {
            this.value = incoming;
            return;
        },
        '-' : function silence () {return;},
        ',' : _":push", 
        '+' : _":operator", 
        '*' : _":operator | sub +, *, add, multiply",
    }

[push]() 


    function push (incoming) {
        let value = this.value;
        if (Array.isArray(value)) {
            value.push(incoming);
        } else {
            this.value = [incoming];
        }
        return;
    }
                

[operator]() 

This allows for some default addition to happen. This replaces the values. 

    function add (incoming) {
        let value = this.value;
        if (typeof value === 'undefined') {
            this.value = incoming;
        } else {
            this.value += incoming;
        }
        return;
    }


### Last Character Meanings for emitting

This deals with the toEmit for when with multiple events.

This is called with context tracker and does the data prep and emit. It should
be given the event to emit

    {
        ',' : function flatArr (ev) {
            const {emitter, values} = this;
            emitter.emit(ev, Array.from(values.values()));  
            return;
        },
        '&' : function map (ev) {
            const {emitter, values} = this;
            emitter.emit(ev, values); 
            return;
        },
        '=' : function flatten (ev) {
            const {emitter, values} = this;
            let arr = Array.from(values.values());
            let data;
            if (arr.length === 1) {
                data = arr[0];
            } else {
                data = arr;
            }
            emitter.emit(ev, data); 
            return;
        },
        '@' : function mapArray (ev) {
            const {emitter, values} = this;
            emitter.emit(ev, Array.from(values));  
            return;
        },
        '^' : function emitOrder (ev) {
            const {emitter, emissions} = this;
            emitter.emit(ev, emissions); 
        }

    }


### Tracker

The tracker object is used to track all the data and what events are
available. Controlling it controls the queue of the when emit. 

To get the event keys being listened to that will report data, get the keys
from the map of values. For the remaining handlers, get the keys from
handlers. 

    function (options, emitter, action, ev) {
        let tracker = this;
    
        tracker.emitter = emitter;
        tracker.toEmit = ev;
        tracker.action = action;
        tracker.originals = [];
        tracker.handlers = new Map();
        tracker.events = new Map();
        tracker.emits = [];
        
        _":options"

        return this;
    }

[options]()

This is where we deal with the toEmit options. We have a reset option (num),
pipes, and the final emitting to be done. 

    const {num, piping, last} = options; 

    tracker.reinitialize = num || 0;
    tracker.piping = piping;

    tracker.




[prototype]()

The various prototype methods for the tracker object. 

    Tracker.prototype.add = _"add";
    Tracker.prototype.append = _"append";
    Tracker.prototype.remove = Tracker.prototype.rem = _"remove";
    Tracker.prototype._removeStr = _"remove string";
    Tracker.prototype.go = _"go";
    Tracker.prototype.cancel = _"cancel";
    Tracker.prototype.reinitialize = _"reinitialize";
    // replace with an array if one wants a full raw record
    Tracker.prototype.emits = {'push' : function () {} }; 

[doc]()

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
 
    _"add:doc"
   
    <a name="tracker-remove" />
    #### remove(arr/str events)

    _"remove:doc"

    <a name="tracker-go" />
    #### go()

    _"go:doc"

    <a name="tracker-cancel" />
    #### cancel()

    _"cancel:doc"

    <a name="tracker-reinitialize" />
    #### reinitialize()

    _"reinitialize:doc"

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

#### Add

This takes in an array of events.

An event could be a string or it could be an array with
`event, n, pipe, initial value`  where pipe transforms the data and the
initial value might be the value used. This can be a kind of reduce setup. 

The pipe and the value will be stored in the tracker. The pipe expects the
data object and the value. 

We are constructing an events list as well. This is the order in which the
data will be sent. 

    function (events) {
        let tracker = this;
        const {emitter, action, handlers, pipes, values} = tracker;
        
        tracker.events = tracker.events.concat(events.map( event => {
            let n, pipe, initial, arr;
            if (Array.isArray(event) ) {
                arr = event;
                [event, n, pipe, initial] = arr;
            }
            if (typeof event !== 'string') {
                emitter.error('event to listen for should be string', event);
                return false;
            }
            if (handlers.has(event) ) {
                emitter.error('event to listen for has already been added',
                    event, n, pipe, initial);
                return false;    
            }
            n = (typeof n === 'number') ? n : 1;
            let handler = emitter.once(event, action, n, emitter.whenHandler,
                tracker);
            tracker.handlers.set(event, handler);
            tracker.pipes.set(event, (typeof pipe !== 'undefined') ?  pipe : identity);
            tracker.values.set(event, initial);
            return event;
        }).filter(a=> a));
    }

[doc]()

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

#### Append

This appends events to the original in tracker. This adds to the
resetting. 

    function (events) {
        const tracker = this;
        this.events = this.events.concat(events);
        return tracker;
    }


#### Remove

We can remove the events.

Note the `true` for the .off command is to make sure the `.remove` is not
called again. Rather important. 

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

[doc]()

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


#### Remove string

This is mainly for use with the `.off` method where the handler has already
been removed from the event. This takes in just a string and removes the
event entirely from the events object. It then runs `go` to see if emit time
is ready.

    function (ev) {
        var tracker = this;

        tracker.handlers.delete(ev);

        tracker.go();
        return tracker;
    }

#### Go

This is where we check if we should emit the event and the data, which could
take a variety of forms, depending on options. The default is an array of
`[event, data]`. Flatten will just give an array of data unless there is just
one item, in which case it is not an array. FlatArr is consistently an array
of data. The order in all cases is that of the original events. 

If reset is true, then we add those events before firing off the next round. 


    function () {
        const tracker = this;
        const {handlers, values, emitter, toEmit} = tracker;

        // check for events that are waiting? compare events to handlers

        if (handlers.size !== 0) {
            return; //not ready yet
        }

        const outData = tracker.preparer();

        if (tracker.countdown) {
            tracker.reinitialize(tracker.countdown-1);
        }

        emitter.emit(toEmit, outData);

        return;
    }


[junk]()

    function () {
        var tracker = this, 
            ev = tracker.ev, 
            data = tracker.data,
            events = tracker.events,
            emitter = tracker.emitter,
            silent = tracker.silent;


        if (Object.keys(events).length === 0) {
            data = data.filter(function (el) {
                return silent.indexOf(el[0]) === -1;  
            });
            if (tracker.flatten) {
                _":flatten"
            }
            // this is to do the falt thing, but always return array
            if (tracker.flatArr) {
                data = data.map(function (el) {return el[1];});
            }
            
            if (tracker.reset === true) {
                tracker.reinitialize();
            } else if (tracker.idempotent === false) {
                if (tracker === emitter.whens[ev]) {
                    delete emitter.whens[ev];
                }
                tracker.go = noop;
            }
            
            emitter.emit(ev, data, tracker.timing); 
            
        }
        return tracker;
    }

[flatten]()

If the tracker is set to flatten, then we either produce a single data value
if data is a singleton array or we produce an array of just the data elements
(second elements). 

    if (data.length === 1) {
        data = data[0][1];
    } else {
        data = data.map(function (el) {return el[1];});
    }


[doc]()

    Checks to see whether tracking list is empty; if so, the waiting event
    is emitted. No arguments. This is automatically called by the other
    methods/event changes. 

#### Cancel

This cancels the .when, removing the handler from all remaining events and
clearing the data. 

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

[doc]()


    Cancel the tracking and abort with no event emitted. No arguments.

#### Reinitialize

This returns the events to the original version. I would call it reset
except that is a flag to call this. 

We first cancel everything to clear it out and then we attach the new
stuff.

We restore tracker.go if it has been silenced. 

    function () {
        var tracker = this;
        var ev = tracker.ev;
        var emitter = tracker.emitter;

        tracker.cancel();
        tracker.add(tracker.original);
        if (tracker.go === noop) {
            delete tracker.go; //restores to prototype
            if (tracker.mutable) {
                if (emitter.whens[ev]) {
                    emitter.log("reinitializing .when; making immutable due to conflict", tracker);
                    tracker.mutable = false;
                } else {
                    emitter.whens[ev] = tracker;
                }
            }
        }
        tracker.go();
        return tracker;
    }

[doc]()

    Reinitializes the tracker. The existing waiting events get cleared and
    replaced with the original events array. All data is wiped. No arguments.  
    

## End String Parser

This is a function to call for checking the end of an event string (during on
or when calls) for various pieces of information. It returns the stripped
string along with an options object. 

The keys to the options object are num, num2 (if a second number), piping
(always present), and last (always present). The num is not always present. 

    function (str) {

        let ind = str.lastIndexOf("!");
        if ( ind === -1) {
            return [str, {}];
        }
        const options = {}; 
        const shortString = str.slice(0, ind);
        let m;
        ind += 1;
        _":get leading numbers"

        _":get pipes"

        _":get last char"
        
        
        return [shortString, options];
    

    }

[get leading numbers]()

This gets leading numbers. For a .on, this converts it to a .once with a
count. For .when, this says how many times to wait (in the form of a .once),
but a second number could be present which is to have the event still be
listened for, processed, but no longer blocking the .when. 

So one could do `5oo` to indicate waiting for 5 (and listening) and then after
that, continue listening, but the .when can fire at any time depending on the
other events. A case might be to require a minimum number of clicks for
something, but continue to count after that. 

    let numReg = /\s*(\d+|oo)\s*/g;
    numReg.lastIndex = ind;
    if ( (m = numReg.exec(str) ) ) {
        options.num = (m[1] === 'oo') ? 
            Infinity : parseInt(m[1], 10);
        if (m = numReg.exec(str) ) {
            options.num2 = (m[1] === 'oo') ? 
                Infinity : parseInt(m[1], 10);
        }
    }
    ind = numReg.lastindex;


[get pipes]()

This matches `=> word` and the word is the pipe name. Pipes are always
returned as an array to execute through. 

    let pipeReg = /\s*\=\>\s*([a-zA-Z]+)\s*/g;
    pipeReg.lastIndex = ind;
    options.piping = [];
    while ( (m = pipeReg.exec(str) ) ) {
        options.pipes.push(m[1]);
    }
    ind = pipeReg.lastIndex;

[get last char]()

This should be a character that describes what to do events in a .when. This
option is ignored by the .on. 

    options.last = str[str.length-1];


## Goodies

These are tools that help with event-when, but are not core to its
functioning. 

### Cache

This solves the problem of needing a resource that one would ideally call only
once. For example, reading a file into memory or getting a web request. 

We use the following form: 

`gcd.cache(event to initiate, event response, function to process, event to
emit)`  

The initiation event could be a string or an array of `[event, data,
when]` . The event response
can be a string or an array of events which becomes a when. The function's
return will be what is passed into the event string in the fourth argument; it
could also do its own emitting. If the fourther string is empty, no emitting
is done. To deal with multiple possible responses (think success, errror,
...), one can do sets of three arguments, replicating what was above. If the
function argument slot is a string, that is emitted with the passed in data
object. 

    function (req, ret, fun, emit) {
        
        var gcd = this;
        var cache = gcd._cache;
        var start, end, data, timing, cached;

        _":prep req"

        _":prep proc"

At this point req should be an array of event, data, timing and we should have
an array of arrays of  `[ret, fun, emit]` to iterate over in dealing with
responses. 
        
        if (cache.hasOwnProperty(start) ) {
            cached = cache[start];
            if (cached.hasOwnProperty("done")) {
                end = cached.done;
                _":do the emit"
            } else {
                cached.waiting.push([fun, emit]);
            }
        } else {
            cache[start] = cached = { waiting : [[fun, emit]]};
            gcd.on(ret, _":setup the handler");
            gcd.emit(start, data, timing);
        }
    }

[prep req]()

Convert the request into an array to get a definite form and apply to emit. 

    if (typeof req === "string") {
        start = req;
        data = null;
        timing = timing ||gcd.timing || "momentary";
    } else if (Array.isArray(req))  {
        start = req[0];
        data = req[1];
        timing = req[3] ||gcd.timing || "momentary"; 
    } else {
        gcd.log("bad cache request", req);
        return;
    }

[prep proc]()

    if (typeof ret !== "string") {
        gcd.log("bad cache return signal", ret);
        return;
    }

    if (typeof fun === "string") {
        emit = fun;
        fun = null; 
    }

[do the emit]()

    if (fun) {
        end = fun(end);
    } 
    if (emit) {
        gcd.emit(emit, end, timing);    
    }
                 
[setup the handler]()

This is the meat of the argument. So the handler acts when the string in ret
is emitted. 

    function (original) {
        var i, n, waiting, proc, end;

        cached.done = original;
        waiting = cached.waiting;
        
        n = waiting.length;
        for (i = 0; i < n; i +=1) {
           end = original;
           proc = waiting.shift();
           fun = proc[0];
           emit = proc[1];
           _":do the emit"
        }
    }
    
[doc]() 

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


[example]()

    var readfile = function (data, evObj) {
        var file = evObj.pieces[0];
        var gcd = evObj.emitter;
        fs.readfile(file, function (err, text) {
            if (err) {
                gcd.emit("file read error:jack", err);
            } else {
                gcd.emit("got file:jack", text);
            }
        });
    };
    emitter.on("need file", readfile);


    emitter.cache("need file:jack",  "got file:jack", diffLines, "lines gotten");
    emitter.cache("need file:jack", "got file:jack", emitDiffWords);
    emitter.cache("need file:jack", "got file:jack", "jack's text");


### Filter

This is a utility function for construction filter functions for checking
string matches of various forms. In particular, it can accept the passing in
of a string for substring matching, array of strings for exact matches,
regex, null for all, and a function that does its own matching. It takes an
optional second boolean argument for negating. 

It also suppots [condition, negate] semantics.

    function (condition, negate) {
        
        if ( (Array.isArray(condition)) && (typeof condition[1] === "boolean") ) {
            negate = condition[1];
            condition = condition[0];
        }

        if (typeof condition === "string") {
           
           if (negate) {
                return function (el) {
                    return el.indexOf(condition) === -1;  
                };
            } else {
                return function (el) {
                    return el.indexOf(condition) !== -1;  
                }; 
            }

        } else if ( Array.isArray(condition) ) {
          
            if (negate) {
                return function (el) {
                    return condition.indexOf(el) === -1;
                };
            } else {
                return function (el) {
                   return condition.indexOf(el) !== -1;
                };
            }

        } else if ( condition instanceof RegExp ) {

            if (negate) {
                return function (el) {
                    return !condition.test(el);
                };
            } else {
                return function (el) {
                    return condition.test(el);
                };
            }

        } else if ( typeof condition === "function" ) {
            
            if (negate) {
                return function () {
                    var self = this;
                    return ! condition.apply(self, arguments);  
                };
            } else {
                return condition;
            }

        } else {
    
            return function () {return true;};
            
        }

    }

[doc]()


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
[fdoc]()

    #### filter(filter type) --> function

    This takes in something of [filter type](#filter) and outputs a function
    that accepts a string and returns a boolean whose value depends on whether
    a matching has occurred. 





### Monitor

Sometimes we may want to intercept/stop/inspect emit events. To do this, we
provide the monitor method that takes in a filter and a handler function. The
first assignment activates the wrapping and the passed in handler will be
activated whenever the filter matches. 

In the constructor, we add `_monitor` which contains `[filter function,
listener]` types. 

If you need to do something after the event finishes executing, you can
attach a custom handler using once to the event. The listener fires
immediately, regardless of the timer.

If you wish to stop the event, the listener should return "stop".


    function (filt, listener) {

        var emitter = this,
            mon = emitter._monitor, 
            temp, ret;


        if (arguments.length === 0) {
            return mon;
        }

        if (arguments.length === 1) {
            _":remove listener"

            if (mon.length === 0) {
                emitter.log("restoring normal emit", filt.filt, filt); 
                emitter.emit = emitter._emit;
            }
            
            return emitter;
        
        } 

        if (arguments.length === 2) {
            if (Array.isArray(filt) && typeof filt[1] === "boolean") {
               ret = [filter(filt[0], filt[1]), listener]; 
            } else {
                ret = [filter(filt), listener];
            }
            mon.push(ret);
            ret.filt = filt;
            emitter.log("wrapping emit", filt, listener, ret);
            emitter.emit = emitter._emitWrap;
            return ret;
        }


    }

[remove listener]()

This removes a listener. It should be an exact match to what is in the
array. 

    temp = mon.indexOf(filt);
    if (temp !== -1) {
        emitter.log("removing wrapper", filt);
        mon.splice(temp, 1);
    } else {
        emitter.log("attempted removal of wrapper failed", filt);
    }

[wrapper]() 

This is the wrapper around the normal emit event function that fires instead
when there are monitors around. 

    function (ev, data, timing) {
        var emitter = this, 
            mon = emitter._monitor,
            go = true;
       
        mon.forEach(function (el) {
            var filt = el[0],
                fun = el[1], 
                temp;

            if (filt(ev)) {
                emitter.log("intercepting event", ev, data, el);
                temp = fun(ev, data, emitter); 
                if (temp === "stop") {
                    emitter.log("stopping event", ev, data, el);
                    go = false;
                }
            }
        });

        if (go) {
            emitter._emit(ev, data, timing);
        }

        return emitter;

    }


[doc]()

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

### MakeLog

This creates a sample log function, storing simple descriptions in `_logs`
and the full data in `_full`, both attached to the log function as
properties. It uses the functions stored in the functions fdesc property to
create the simple descriptions. 

    function (len) {
    

        var emitter = this;
        
        var s;
        _":how to serialize"
        var se = emitter.serial;


        var logs = [],
            full = [], 
            fdesc = {           
            
`_"logs"`

            },
            temp;

        var ret = function (desc) {
            var args = Array.prototype.slice.call(arguments, 0);

            if ( ret.fdesc.hasOwnProperty(desc) ) {
                temp = fdesc[desc].apply( emitter, args.slice(1) );
                if (temp) {
                    logs.push( fdesc[desc].apply( emitter, args.slice(1) ) );
                }
            }

            full.push(emitter.serial(args));
        };

        ret._logs = logs;
        ret._full = full;
        ret.fdesc = fdesc;

        ret.full = function (filt, neg) {
            _":array filt"
            var f = filter(filt, neg);
            return full.filter(f); 
        };

        ret.logs = function (filt, neg) {
            _":array filt"
            var f = filter(filt, neg);
            return logs.filter(f); 
        };

        emitter.log = ret; 
        return ret;
    }

[array filt]()

The array of matching exact strings in the logs is not useful. So instead, we
make it do partial matches. For this, we define a function to pass into
filter. 

    var arr;
    if (Array.isArray(filt) ) {
        arr = filt;
        filt = function (el) {
            return arr.some(function (partial) {
                return ( el.indexOf(partial) !== -1 );     
            });
        };
    } 
   
[how to serialize]() 

This should facilitate different serialization schemes. 

    switch (typeof len) {
        case "number" : 
            s = function () {
                var str =  emitter.serial.apply({}, 
                    Array.prototype.slice.call(arguments, 0) );

                var ret = str.slice(0,len);

                return ret;
            };
        break;
        case "function" : 
            s = len;
        break;
        default :
            s = emitter.serial;
    }


[doc]()

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


### Logs

This is where we keep track of the log statements and what to do with them. 


    "emit" : function (ev, data, timing, evObj) {
        return evObj.count + ". EMITTING " + se(ev)  + 
            ( (typeof data !== "undefined") ? 
                " DATA " + s(data) :
                "" ) +
            ( (timing !== emitter.timing) ? " TIMING " + 
                se(timing) : "" );
    },
  
    "restoring normal emit" : function () {
        return "Last monitor removed, emit restored";
    },

    "wrapping emit" : function (filt, listener) {
        return "ADD MONITOR " + s(filt, listener);
    },

    
    "removing wrapper" : function (filt) {
        return "SUB MONITOR " + s(filt.filt, filt[1]);
    },

    "attempted removal of wrapper failed": function(filt){
        return "NO SUCH MONITORY " + s(filt);
    },

    "intercepting event" : function ( ev, data, filt){
        return "INTERCEPTING " + se(ev) +
               ( (typeof data !== "undefined") ? 
                " DATA " + s(data) :
                "" ) +
            " MONITOR " + s(filt.filt, filt[1]);
    },

    "stopping event" : function(ev, data, filt) {
        return "STOP " + se(ev) +
            " MONITOR " + s(filt.filt, filt[1]);
    },

    "deleting scope event" : function (ev, scope) {
        return "REMOVING SCOPE FOR " + se(ev); // + " " + s(scope);
    },

    "overwriting scope event" : function(ev, obj, scope) {
        return "OVERWRITING SCOPE FOR " + se(ev); 
        // + " from " + s(scope) + " to " + s(obj);
    }, 

    "creating scope event" : function (ev, obj) {
        return "CREATING SCOPE FOR " + se(ev); // + " now has a scope " + s(obj); 
    },

    "on" : function (ev, proto, context) {
       if (proto.hasOwnProperty('_label') ) {
            proto = proto._label;
            if ( (proto.indexOf("(when)" ) === 0) ||
            (proto.indexOf("(once)") === 0 ) ) {
                return;
            }
        }
        return "ATTACH " + s(proto) + " TO " + se(ev); 
        //+ ( (context && context.hasOwnProperty('_label') ) ? 
        //        " CONTEXT " + s(context._label) : "" ); 
    },

    "all handlers removed from all events" : function () {
        return "ALL HANDLERS WIPED";
    }, 

    "handler for event removed" : function (ev, removed) {
        var ident = s(removed._label) ||
            se(removed.map(function (el) {return el.action;}));
        return "REMOVING HANDLER " + ident +
            " FROM " + se(ev);
    },

    "removed handlers on event ignoring when" : function (ev) {
        return "REMOVING NOT WHEN HANDLERS FROM " + se(ev);
    },

    "removing all handlers on event" : function (ev) {
        return "REMOVING ALL HANDLERS FROM " + se(ev);
    },

    "once" : function(ev, n, proto, context) {
        if (proto.hasOwnProperty('_label') ) {
            proto = proto._label;
        }
        return "ATTACH " + s(proto) + " TO " + se(ev) + 
            " FOR " + se(n);
            // + ( (context && context.hasOwnProperty('_label') ) ?  " CONTEXT " + s(context._label) : "" ); 
    },


    "when" : function (events, ev, timing, reset) {
        return "WHEN: " + se(ev) + 
            " AFTER: " + 
            se(events) + 
            ( timing ? " TIMING " + s(timing) : "" ) +
            ( reset ? " (RESET ON) " : "" ); 
    },
    
    "when add" : function (events, ev) {
        return "WHEN: " + se(ev) + 
            " AFTER: " + 
            se(events) + "(PLUS OTHERS)";
    },

    
    "removed action" : function(name) {
        return "ACTION DELETE: " + se(name);
    },
    
    "overwriting action" : function (name, proto) {
        return "ACTION: " + se(name) + " OVERWRITTEN BY " + s(proto);
    },

    "creating action" : function(name, proto, context) {
        if (proto.hasOwnProperty("_label") ) {
            proto = proto._label;
        }
        return "NEW ACTION " + se(name) +
            " FUN " + s(proto) + 
            ( context ?  " CON " + s(context) : "" ); 
    },


    "emission stopped" : function (ev) {
        return "STOPPING " + se(ev); 
    },

    "queue cleared of all events" : function () {
        return "EVENT QUEUE CLEARED";
    },

    "event cleared" : function (ev) {
        return "EVENT" + se(ev) + " CLEARED";
    },

    "some events stopped" : function(a, rq, rw) {
        
        var qlist = rq.map(function (el) {
            return el.ev;
        }); 

        var wlist = rw.map(function (el) {
            return el.ev;
        });  

        return "STOPING EVENTS " + s(qlist) + s(wlist) + " PER FILTER " + se(a);
    },

    "error raised" : function(e, handler, data, evObj, context) {
        _":error"
        return err;
    },
    
    "executing action" : function ( value, context, evObj) {
        var event = evObj.ev;
        var l = evObj.cur[0].length;
        event = "'" + event.slice(0, l) + "'" + event.slice(l);
        return evObj.count + ") " + 
            "ACTING " + se(value) +
            " EVENT " + event;
            //se(evObj.cur[0]);
            //+ ( context ?  " CON " + s(context) : "" ); 
    },

    "action not found" : function (value, evObj) {
        return  evObj.count + ") " + 
            " EVENT " +
            se(evObj.cur[0]); 
            //+ " NO ACTION " + se(value);
    },

    "executing function" : function (value, context, evObj) {
        /*var f = se(value);
        if (f === "``") {
            return ;
        }*/
        var n = value._label || value.name;
        if (!n) {
            return ;
        }
        return evObj.count + ") " + 
            "EXECUTING " + n + 
            " EVENT " + 
            se(evObj.cur[0]); 
            //+ ( context ?  " with context " + s(context) : "" ); 
    },

    "canceling tracker" : function (tracker) {
        return "CANCEL " + s(tracker._label);
    }

[error]()

This code is also present in default error method with the string being
console.logged.

    var err = "error " + e + "\n\n" +
        "event " + s(evObj) +  
        "\nhandler " + s(handler) + 
        "\ndata " + s(data) + 
        "\ncontext " + s(context) + 
        "\nscopes " + s('scopes') + 
        "\nstack " + e.stack;

[emergency logs]() 

These are the log events that are really to only be used in dire situations.
They monitor internals and should not be that useful if everything with the
library is going smoothly. They will be captured in the full log.

"looping called again", caller;
"looping hit max", loop);
"loop ended", caller, loop);
"firing", ev, f, evObj);
"fired", ev, f, evObj);
"untracked" : function (ev,  htypetracker, htype) { 
"unreachable reached" : function (removal, ev, htype) {
"value not executable" : function (value, evObj) {






### Error

All handler execution are encapsulated in a try..catch. This allows for easy
error handling from controlling the emitter.error method. It is passed in
the error object, the handler value, emit data, event object, and the
executing context. 

What is done here is a default and suitable for development. In production,
one might want to think whether throwing an error is a good thing or not. 

Since we are throwing an error, we need to make sure emitter.looping is set
to false so that if the error is handled and path resumes, we still get a
flow of the emitter. 

    function (e, handler, data, evObj, context) {
        var emitter = this;
        emitter._looping = false;
        var s = emitter.serial;
        _"logs:error"
        console.log(err);
        emitter.log("error raised", e, handler, data, evObj, context);
        //throw Error(e);
    }

[doc]() 

    ### error()

    This is where errors can be dealt with when executing handlers. It is
    passed in the error object as well as the handler value, emit data,
    event object, and executing context. The current full handler can be
    found in the second entry of the cur array in the event object. 

    If you terminate the flow by throwing an error, be sure to set
    `emitter._looping` to false. 
    
    This is a method to be overwritten, not called. 

    __example__

        _":example"

[example]()

    emitter.error = function (e, handler, data, evObj, context) {
        console.log( "Found error: " + e + 
            " while executing " + handler + 
            " with data " + data + 
            " in executing the event " + evObj.cur[0] + 
            " with context " + context ); 
        emitter._looping = false; 
        throw Error(e); 
    };



### Events

This allows us to see what events have handlers and the number of handlers
they have. 

We can pass in a function as first argument that should return true/false
when fed an event string to indicate include/exclude. Alternatively, we can
pass in a string that will be used as a regex to determine that. Given a
string, we can include a negate boolean which will negate the match
semantics. 

If nothing is passed in, then we return all the events that have handlers.

    function (partial, negate) {
        var emitter = this, 
            handlers = emitter._handlers,
            keys = Object.keys(handlers), 
            filt;

        filt = filter(partial, negate);

        return keys.filter(filt);
    }


[doc]()

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

        _":example"

[example]()

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

### Scopes

This will return an object with with key as scope, value as context. 


    function (evfilt, neg) {

        var emitter = this, 
            f, keys, ret;

        keys = emitter.scope();

        if (evfilt) {
            f = filter(evfilt, neg);
            keys = keys.filter(f);
        }

        ret = {};
        keys.forEach(function (el) {
            ret[el] = emitter.scope(el);
        });
        return ret;
    }
    

[doc]()

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

        _":example"

[example]()

    emitter.scopes("bob") === {bob: {bd :"1/1"} }

    emitter.scopes("bob", true) == {}

### Actions

This will return an object with with key as action, value as handler. 


    function (evfilt, neg) {

        var emitter = this, 
            f, keys, ret;

        if (!evfilt) {
            keys = Object.keys(emitter._actions);
        } else {
            f = filter(evfilt, neg);
            keys = Object.keys(emitter._actions).filter(f);
        }

        ret = {};
        keys.forEach(function (el) {
            ret[el] = emitter._actions[el];
        });
        return ret;
    }

[doc]()

    
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


### Handlers

Given a list of events, such as given by event listing, produce an object
with those events as keys and the values as the handlers. 

    function (events, empty) {
        var emitter = this, 
            handlers = emitter._handlers, 
            ret = {}; 

        if (!events) {
            events = Object.keys(handlers);
        } else if (!Array.isArray(events)) {
            events = emitter.events(events);
        } else if (events[1] === true) {
            events = emitter.events(events[0], events[1]);
        }

        events.forEach(function (event) {
            if ( handlers.hasOwnProperty(event) ) {
                ret[event] = handlers[event].slice();
            } else {
                if (empty) {
                    ret[event] = null;
                }
            }
        });

        return ret;

    }

[doc]() 

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

        _":example"

[example]()

    emitter.handlers("bob") === {
        "bob wakes up" : [handler1],
        "bob sleeps" : [handler2, handler3]
        }


### Stop

Clear queued up events. 

    function (a, neg) {
        var queue = this._queue,
            emitter = this,
            ev, rw, rq; 

        if (arguments.length === 0) {
            rq = queue.splice(0, queue.length);
            emitter.log("queue cleared of all events", rw, rq);
            return emitter; 
        }

        if (a === true) {
            ev = queue.shift();
            ev.stop = true;
            emitter.log("event cleared", ev);
            return emitter;
        }
        
        _":splice queue waiting"
        return emitter;
    }

[splice queue waiting]()

This should handle the various cases of string/array of strings/function in
determining whether an event should be removed. 
 
The queues consist of event objects.

We filter both queue and waiting, storing the ones we wish to keep. After
going through it, we then use splice to insert the array of ones to keep (in
temp) and remove all of the old elements. I do not about this being efficient,
but it should work. 
    
    var filt, f, temp=[];

    f = filter(a, neg);
    filt = function (el, ind, arr) {
        if ( f(el.ev, el, ind, arr) ) {
            el.stop = true;
        } else {
            temp.push(el);
        }
    };
    queue.forEach(filt);
    temp.unshift(0, queue.length);
    rq = queue.splice.apply(queue, temp);
    temp.splice(0, temp.length);
    emitter.log("some events stopped", a, rq, rw);



[doc]() 

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

        _":example"

[example]()
    
    // stop crazy from acting
    emitter.stop("crazy");
    // stop all events
    emitter.stop();
    // stop next event on queue
    emitter.stop(true);
    // stop all events with button in title
    emitter.stop(/^button/);
    

### Cycle

This is a modified form  of Crockford's JSON 
[cycle.js](https://github.com/douglascrockford/JSON-js/blob/master/cycle.js)
It was released as public domain, 2013-02-19 with no warranty.

My main modification involves catching functions and replacing them with an
object of the form `{$fun:label}` where the label is found in the function
`_label` property. If no label is found, then the function is ignored. If an
object has a label, then that is returned and the object is not recursed.
Useful for support objects placed in an object, such as emitter in evObj.

I am only interested in this for logging purposes. I am therefore ignoring the
recycler part (for now). If I wanted to reinstantiate it, I would want to also
think about how to resurrect functions. 

Make a deep copy of an object or array, assuring that there is at most
one instance of each object or array in the resulting structure. The
duplicate references (which might be forming cycles) are replaced with
an object of the form `{$ref: PATH}`
where the PATH is a JSONPath string that locates the first occurance.
So,

<pre>
var a = [];
a[0] = a;
return JSON.stringify(JSON.decycle(a));
</pre>

produces the string `[{"$ref":"$"}]`.

JSONPath is used to locate the unique object. $ indicates the top level of
the object or array. [NUMBER] or [STRING] indicates a child member or
property.

[main]()

    function (obj) {

        var objects = [],   // Keep a reference to each unique object or array
            paths = [],     // Keep the path to each unique object or array
            ret;

        ret = (_":derez")(obj, "$");
        return ret;
    }
        
[derez]()

The derez recurses through the object, producing the deep copy.

`typeof null === 'object'`, so go on if this value is really an object but not
one of the weird built-in objects.

    function derez(value, path) {

        var i, name, nu, temp, ret;
 
        if (typeof value === "function") {
            if (value.hasOwnProperty("name")) {
                ret = value.name;
            } else {
                ret = value.toString();
                temp = ret.indexOf("(");
                ret = ret.slice(9, temp).trim() || "";
            }
            return "`" + ret + "`";
        }

        if ( typeof value === 'object' && value !== null &&
            !(value instanceof Boolean) &&
            !(value instanceof Date)    &&
            !(value instanceof Number)  &&
            !(value instanceof RegExp)  &&
            !(value instanceof String) ) {
                
                _":descend"

        }

        return value;
    }

[descend]()

If the value is an object or array, first check for a label. If there is a
label, we store them as a type such as $obj or $arr. One can also use a
custom type stored in `_type` which will have a $ appended in front. 

If not, then look to see if we have already encountered it. If so, return a
$ref/path object. This is a hard way, linear search that will get slower as
the number of unique objects grows.

If the object is not already known, add it to objects and associate the passed
in path to it.

Once the original reference is stored, then we duplicate it, two separate
paths for arrays vs. other objects. Note that later uses of the object do not
need to care about the duplicate because the path is being stored for them,
not the copy. 

    if ( value.hasOwnProperty("_label") ) {
        if ( value.hasOwnProperty("_type") ) {
            temp = {};
            temp["$"+value._type] = value._label;
            return temp;
        } else if ( Array.isArray(value) ) {
            return {$arr:value._label};
        } else {
            return {$obj:value._label};
        }
    }

    if ( ( i = objects.indexOf(value) ) !== -1 ) {
        return {$ref: paths[i]};
    }

    objects.push(value);
    paths.push(path);

    if ( Array.isArray(value) ) {
        return value.map(function (el, ind) {
            return derez(el, path + "[" + ind + "]");
        });
    }


    nu = {};
    for ( name in value ) {
        if ( value.hasOwnProperty(name) ) {
            nu[name] = derez(value[name],
                path + '[' + name + ']');
        }
    }
    return nu;

#### Serial

This is a simple wrapper to stringify the result of the decycle. If multiple
arguments are supplied, an arrayified version of is yielded.

A function is denoted with tick marks. To avoid string quoted tick marks, we
remove the added quotes. 

    function (obj) {

        var ret;
        
        if (arguments.length > 1) {
            obj = Array.prototype.slice.call(arguments, 0);
        }

        ret =  JSON.stringify(decycle(obj)) || "";

        return ret.replace(/\"\`|\`\"/g, "`");
    
    }

[doc]()

    #### serial(obj) --> string

    This takes in an object, or objects, and prints out a string suitable for
    inspecting them. Functions are denoted by tick marks around the name, if
    there is one. Multiple arguments are output as if they were all
    encapsulated in an array. 


### Graphical Representation

This option institutes converting the emits, actions, whens, whatever, into a
graphical structure. 

Current thought is to use [vis.js](visjs.org) as the target output.


## README

The readme for this. A lot of the pieces come from the doc sections.

    ## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

    _"project.md::introduction:doc"

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
    _"emit:doc"

    ---
    <a name="storeEvent"></a>
    _"store event:doc"
    
    ---
    <a name="monitor"></a>
    _"monitor:doc"


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
    <a name="cache"></a>
    _"cache:doc"

    ---
    <a name="action"></a>
    _"action:doc"

    ---
    <a name="actions"></a>
    _"actions:doc"

    ---
    <a name="scope"></a>
    _"scope:doc"

    ---
    <a name="scopes"></a>
    _"scopes:doc"

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
    <a name="queueempty"></a>
    The function `emitter.queueEmpty()` fires when all events that are waiting
    have been called. The default is a noop, but one can attach a function to
    the emitter that does whatever it wants. 

    ---
    <a name="log"></a>
    _"makelog:doc"
    
    ---
    <a name="filt"></a>
    _"filter:fdoc"
    
    ---
    <a name="serial"></a>
    _"serial:doc"
    

    <a name="emitter"></a>
    ### Emitter Instance Properties

    _"constructor:doc"

    ---
    <a name="handler"></a>
    ### Handler
    _"handler:doc"

    ---
    ### Tracker
    <a name="tracker"></a>
    _"tracker:doc"

    ___
    ### Filter Type
    <a name="#filter"></a>
    _"filter:doc"

## Bad When

no immutable -- emiting an event from a when links them all. 

[junk]()

The argument reset allows for reseting to the initial state once
fired. 

Emitting scoped events will count also as a firing of the parents, e.g.,
`.when([["button", 3], "disable")` will have `.emit("button:submit")` remove
one of the button counts (unless event bubbling is stopped). But
`.emit("button")` will not count for any `.when("button:submit")`. 

When using .when, if the event to be emitted already has a when, then the
events are tacked on. Timing and reset are ignored if the .when already
exists. If one wants a .when to not be added to in this fashion, then have a
fifth argument of true.

The initialOrdering setting is a local override to a global setting of whether
the .when data should be presented in the order of creation of the .when or in
the event emitting. The global default is in the order of data;  


    function (events, ev, options timing, reset, immutable, initialOrdering) {    

        var emitter = this;
        var tracker; 

        if (!immutable) {
            tracker = emitter.whens[ev]; 
            if (tracker) {
                emitter.log("when add", events, ev);
                tracker.add(events);
                return tracker;
            }
        }

        if (typeof initialOrdering === "undefined") {
           initialOrdering = emitter.initialOrdering;  
        }

        tracker = new Tracker ();

        tracker.emitter = emitter;
        tracker.ev = tracker._label = ev;
        tracker.data = [];
        tracker.silent = [];
        _":assign timing reset"
        tracker.original = events.slice();
        tracker.idempotent = false;
        tracker.initialOrdering = initialOrdering;

The handler adds the data. We prepopulate the data array with [ev] arrays in
the order of adding if we are doing initial ordering. If an event is placed on
it repeatedly, then there are separate entries in data for each one, in the
order of adding. In the event of no initialOrdering, then we simply pop on
data with the event name whenever the data is defined; ignoring it otherwise.
With initialOrdering, we add the data as null. 

Create a default when action. Use context to create individual whens. The
tracker can be the context. 


        var handler = new Handler (function (data, evObj) {
            var ev = evObj.cur[0]; // subevent
            var fullev = evObj.ev; // full event that triggered
            var tracker = this;
            var results = tracker.data;
            var i, n;
            if (tracker.initialOrdering) {
                n = results.length;
                if (typeof data === "undefined") {
                    data = null;
                }
                for (i =0; i < n; i+=1) {
                    if ( (results[i].length === 1) && (results[i][0] === ev) ) {
                        results[i][1] = data;
                        if (fullev !== ev) {
                            results[i][2] = fullev;
                        }
                        break;
                    }
                }
            } else {
                if (typeof data !== "undefined") {
                    if (fullev !== ev) {
                        tracker.data.push([ev, data, fullev]);
                    } else {
                        tracker.data.push([ev, data]);
                    }
                }
            }
            tracker.remove(ev);
        }, tracker);


        handler.tracker = tracker;

        handler._label = "(when)" + ev;

        tracker.handler = handler; 

        tracker.add(events);

        if (!immutable) {
            emitter.whens[ev] = tracker;
            tracker.mutable = true;
        } else {
            tracker.mutable = false;
        }
        
        emitter.log("when", events, ev, timing, reset, tracker);

We return the tracker since one should use that to remove it. If you want
the handler itself, it is in tracker.handler. It just seems more natural
this way since the manipulations use tracker. 

        return tracker;
    }



[assign timing reset]()

Four arguments is not so good because who can remember the order? Since
timing should be a string while reset should be a boolean, we can handle
this.

Note that we are not actually checking for correctness, just trying to make
sure that properly written, but unordered, is okay. 

    if (typeof timing === "string") {
        tracker.timing = timing;
        tracker.reset = reset || false;
    } else if (typeof timing === "boolean") {
        tracker.reset = timing;
        if (typeof reset === "string") {
            tracker.timing = reset;
        } else {
            tracker.timing = emitter.timing;
        }
    } else {
        tracker.timing = emitter.timing;
        tracker.reset = reset || false;
    }

Bad tracker add 

[junk]()

    function (newEvents) {
        var tracker = this,
            events = tracker.events,
            handler = tracker.handler,
            data = tracker.data, 
            i;

        if (arguments.length !== 1) {
            newEvents = Array.prototype.slice.call(arguments);
        } else if (! Array.isArray(newEvents) ) {
            newEvents = [newEvents];
        } else if (typeof newEvents[1] === "number") {
            newEvents = [newEvents];
        }

        newEvents.forEach(function (el) {
            var num, str, order;
            if (typeof el === "string") {
                str = elet scope = options.sco;
                num = 1;
            }
            if (Array.isArray(el) ) {
                if ((typeof el[1] === "number") && (el[1] >= 1) && 
                    (typeof el[0] === "string") ) {
                    
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
                if (tracker.initialOrdering) {
                    for ( i = 0; i<num; i+=1 ) {
                        data.push([str]);
                    }
                }
                tracker.latest = str;
            }
        });
        tracker.go();
        return tracker;
    }

