# [event-when](# "version: 0.6.0| jostylr")


This is an event library that emphasizes flow-control from a single dispatch
object. 

## Introduction

This provides a succinct introduction to the library for the readme and this
file.

[doc]()

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
        emitter.when(["file parsed:jack", "database returned:jack"],
            "all data retrieved:jack");
        ``` 
        
        This is why the idea of a central emitter is particularly useful to
        this library's intent.
    * [Scope](#scope). Events can be scoped. In the above example, each of
      the events are scoped based on the user jack. It bubbles up from the
      most specific to the least specific. Each level can access the
      associated data at all levels. For example, we can store data at the
      specific jack event level while having the handler at "all data
      retrieved" access it. Works the other way too. One can stash the
      scope into scope jack and the handler for `database returned` can
      access the name jack and its scope.  
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
    On my MBA mid-2011, it does 5e4 emits in a half a second, 5e5 emits in
    about 4.5 seconds while the native emitter does 5e5 in about a tenth of a
    second.

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

## Files

The file structure is fairly simple. 


* [index.js](#main "save:|jshint") This is the node module entry point and
  only relevant file. It is a small file.
* [ghpages/index.js](#main "save:") This is for browser access. 
* [test/benchmark.js](#benchmark "save:|jshint") This is a very simple benchmark
  test. 
* [README.md](#readme "save: ") The standard README, new version.
* [package.json](#npm-package "save: json  | jshint") The requisite package
  file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items
  todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license.
* [.travis.yml](#travis "save:") A .travis.yml file for 
  [Travis CI](https://travis-ci.org/)
* [.gitignore](#gitignore "Save:") A .gitignore file
* [.npmignore](#npmignore "Save:") A .npmignore file

For development, you can use the bundled literate-programming easily by using
`npm run-script compile`

## Main

This is the main structure of the module file.


    /*jshint eqnull:true*/
    /*global setTimeout, process, module, console */

    ;(function () {
        var empty = {};

        var noop = function () {};

        var filter = _"filter";

        var decycle = _"cycle:main";

        var serial = _"serial";

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

We bind `looper` which is the execution lop to the instance since it will be
passed in without context via nextTick or analog.

    function () {

        this._handlers = {};
        this._queue = [];
        this._queue.name = "queue";
        this._waiting = [];
        this._waiting.name = "waiting";
        this._actions = {};
        this._scopes = {};
        this._monitor = [];
        this.scopeSep = ":";
        this._looping = false;
        this.loopMax = 1000;
        this.emitCount = 0;
        this.timing = "momentary";

        this.looper = this.looper.bind(this);

        this._label = "emitter";

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    
    
    EvW.prototype._emit = EvW.prototype.emit = _"emit";
    EvW.prototype._emitWrap = _"monitor:wrapper";
    EvW.prototype.monitor = _"monitor";
    EvW.prototype.eventLoader = _"event loader";
    EvW.prototype.now = _"emit:convenience method| substitute(TIMING, now)";
    EvW.prototype.momentary = _"emit:convenience method| substitute(TIMING, momentary)";
    EvW.prototype.soon = _"emit:convenience method| substitute(TIMING, soon)";
    EvW.prototype.later = _"emit:convenience method| substitute(TIMING, later)";
    EvW.prototype.scope = _"scope";
    EvW.prototype.scopes = _"scopes";
    
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
    EvW.prototype.actions = _"actions";
    EvW.prototype.makeHandler = _"make handler";
    EvW.prototype.error = _"error";

    EvW.prototype.filter = filter;
    EvW.prototype.decycle = decycle;
    EvW.prototype.serial = serial;


[doc]()

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
    * `_queue` consists of events to be fired in this tick. These are the
      [event objects](#evobj) which get passed in as the second argument to
      the handlers. 
    * `_waiting` is the queue for events to be fired after next tick.
    * `_actions` has k:v of `action name: handler` The handler can be of type
      Handler or anything convertible to it. 
    * `_scopes` has k:v of `scope name: object` When an event is emitted with
      the given scope, the object will be passed in and is accessible to any
      handler reacting to an event along the scope chain. 
    * `_looping` tracks whether we are in the executing loop. 


#### Emit

This function emits the events.

We will load the event onto the queue or waiting list, depending on the
timing provided. We create an object, `evObj` that will be passed around as
the second argument into handlers. It wil contain the deconstruction of the
scopes along with their scope objects. It also creates a copy of the
handlers array for each of the scope levels. 

When ready, we load the events and call the loop (which exits immediately if
we are already in the loop). 

    function (ev, data, timing) {
        var emitter = this, 
            sep = emitter.scopeSep, 
            scopes = {};

        timing = timing ||emitter.timing || "momentary";

        var pieces = ev.split(sep);

        emitter.emitCount += 1;

        var evObj = {
            emitter: emitter,
            ev : ev,
            data : data,
            scopes : scopes, 
            count : emitter.emitCount,
            timing : timing,
            unseen : true
        };

        var events = evObj.events = [];
i
Note we use the reduce function for the construction of each scope level,
but we have no need for the finished string, just the intermediates.

        pieces.reduce(function (prev, el) {
            var ret = prev + (prev ? sep + el : el);            
            scopes[ret] = emitter.scope(ret);
            scopes[el] = emitter.scope(el);
            var h = emitter._handlers[ret];
            if (h) {
                //unshifting does the bubbling up
               events.unshift([ret, h.slice()]);
            }
            return ret;
        }, ""); 

        evObj.pieces = pieces.reverse();

        emitter.eventLoader(timing, evObj);

        emitter.log("emit", ev, data, timing, evObj);

        emitter.looper(ev);

        return emitter;
    }


[doc]() 


    ### emit(str ev, obj data, str timing) --> emitter

    Emit the event.  

    __arguments__

    * `ev`  A string that denotes the event. 
    * `data` Any value. It will be passed into the handler as the first
      argument. 
    * `timing` One of "now", "momentary", "soon", "later" implying emission
      first on queue, last on queue, first on waiting list, last on waiting
      list, respectively. "Momentary" is the default if not provided as that
      will preserve the order of emitting. The waiting list is shifted once
      for each tick (or in the browser, setTimeout).

    __return__

    The emitter for chaining. The events may or may not be already emitted
    depending on the timing. 

    __convenience forms__ 

    * `.now`  Event A emits B, B fires after the emitting handler finishes,
      but before other handler's for A finishes. This is the function
      calling model.
    * `.momentary` Event A emits B, B fires after A finishes. This is more
      of a synchronous callback model. It is the same as `.emit` with the
      default setting.
    * `.soon` Event A emits B then C, both with soon, then C fires after
      next tick. B fires after second tick.
    * `.later` Event A emits B then C, both with later, then B fires after
      next tick. C fires after second tick.

    __scope__ 

    Note that if ev contains the event separator, `:` by default, then it
    will be broken up into multiple events, each one being emitted. The
    order of emission is from the most specific to the general (bubbling
    up).  `emitter.scopeSep` holds what to split on.

    In what follows, it is important to know that the handler signature 
    is `(data, evObj)`.

    As an example, if the event `a:b:c` is emitted, then `a:b:c` fires,
    followed by `a:b`, followed by `a`. The scope objects available, however,
    include that of all three of the emitted events as well as `b`, and `c`
    separately. Thus, we can have an event `a:b` with a handler on `a` that
    uses the scope of `b`. The name `b` can be found by accessing 
    `base = evObj.pieces[0]` and the scope accessed from `evObj.scopes[base]`.
    Note that `b` will not fire as a stand-alone event; it is just its scope
    which can be found that way.

    To stop the emitting and any bubbling, set `evObj.stop === true` in the
    handler . To do more
    fine-controlled stopping, you need to manipulate `evObj.events` which is
    an array consisting of `[string ev, handlers]`.


    Once the event's turn on the queue occurs, the handlers for all the
    scopes fire in sequence without interruption unless an `emit.now` is
    emitted. To delay the handling, one needs to manipulate
    `evObj.emitter._queue` and `._waiting`. 


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

This makes the now, later, ... methods. TIMING gets replaced with the timing.
That's it!

    function (ev, data) {
        var emitter = this;
        emitter.emit(ev, data, "TIMING");
        return emitter;
    }

#### Event Object

    Each emitted event calls the listener with the first argument as the data
    and second argument as an event object. The event object consists of the
    following properties: 

    * `emitter` This is the emitter itself allowing one full access to
      emitting, oning, offing, whatever.
    * `ev` This is the full event string that has been emitted.
    * `data` This is the data object that is passed into the emit. It is the
      same as the first argument given to the handler. 
    * `scopes` This is an object whose keys are the scope event strings and
      whose values are the objects stored under that scope. 
    * `pieces` This is the result of splitting `ev` on the scope separator,
      reversed.
    * `count` This is the value of the counter for which emit this was. 
    * `timing` What the timing of the emit was.
    * `events` This is an array that contains `[event substring, handlers]`.  The
      handlers array is a copy of the handlers attached to the named event. 
    * `cur` This is changed after each handler handling. It is an array of
      `[event substring, handler]` It represents the current event and handler
      being executed. 
    * `stop` This is not set, but if set to true, this will halt any further
      handlers from firing from this event object's events.
    
    __example__

    If the event "file:bob" was emitted with data "neat" , then the event object emitted would
    be something like: 

        {emitter : emitter,
         ev : "file:bob",
         data : "neat",
         scopes : {file: {}, bob: {}, "file:bob" : {} },
         pieces : ["bob", "file"],
         count : 102,
         timing : "momentary",
         events : [ ["file:bob" , [handler1]], ["file", [handler2]] ],
         cur : ["file:bob", handler1]
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

#### Monitor

Sometimes we may want to intercept/stop/inspect emit events. To do this, we
provide the monitor method that takes in a filter and a handler function. The
first assignment activates the wrapping and the passed in handler will be
activated whenever the filter matches. 

In the constructor, we add _monitor which contains `[filter function,
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

#### Scope

The usefulness of scopes is twofold. One, it allows for a hierarchial calling
of events, such as bubbling in the browser.  But the other use is in having
scope-related objects that one can access. That is, context is given from an
event perspective. So instead of each button listening for an event, we can
have each event retaining a reference to the button. Beware memory leaks; use
once and off! 

This is where we define the function for adding/removing that context. Given
an event string and a non-null value, that value will be stored under that
string. A null value removes the string as a scope with context. If there is
no second argument, then the scope object is returned. 

Note that even with no context, the different scopes as events can be used. It
is not necessary to give them context. 

We return the event name so that it can then be used for something else. 

    function (ev, obj) {
        var emitter = this,
            scope;

        if (arguments.length === 0) {
            return Object.keys(emitter._scopes);
        }

        scope = emitter._scopes[ev];
        
        if (arguments.length === 1) {
            return scope; 
        }

        if ( obj === null ) {
            emitter.log("deleting scope event", ev, scope);
            delete emitter._scopes[ev];
            return scope;
        }

        if (emitter._scopes.hasOwnProperty(ev) ) {
            emitter.log("overwriting scope event", ev, obj, scope);
        } else {
            emitter.log("creating scope event", ev, obj);
        }

        emitter._scopes[ev] = obj;

        return emitter;
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
    * 2 arguments. Emitter returned for chaining.

    __note__ 

    The scope is associated not only just the full scope, but also its parts.
    For example, the event "file:bob" would have associated scopes of "file",
    "bob", and "file:bob". In a handler with signature `(data, evObj)`, this
    can be accessed by `evObj.scopes.bob`, `evObj.scopes.file`, and
    `evObj.scopes["file:bob"]`,  assuming there are scopes associated with
    those strings. 

    __example__

        _":example"

[example]()

    emitter.scope("bob", {bd: "1/1"});

    emitter.scope("bob") === {bd:"1/1"};

    emitter.scope() === ["bob"];

#### Scopes

This will return an object with with key as scope, value as context. 


    function (evfilt, neg) {

        var emitter = this, 
            f, keys, ret;

        if (!evfilt) {
            keys = Object.keys(emitter._scopes);
        } else {
            f = filter(evfilt, neg);
            keys = Object.keys(emitter._scopes).filter(f);
        }

        ret = {};
        keys.forEach(function (el) {
            ret[el] = emitter._scopes[el];
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
    scope's value. If the value is an object, then that object is the same
    object and modifications on one will reflect on the other. 

    __example__

    Following the example of bob in scope...

        _":example"

[example]()

    emitter.scopes("bob") === {bob: {bd :"1/1"} }

    emitter.scopes("bob", true) == {}


#### On

It takes an event (a string) and a Handler or something that converts to a
Handler.  To have segments that are always in order, use a Handler with an
array value of handler-types that will be executed in order.


    function (ev, proto, context) {
        var emitter = this,
            handlers = emitter._handlers;

        var f = new Handler(proto, context); 

        if (handlers.hasOwnProperty(ev)) {
                handlers[ev].push(f);
        } else {
            handlers[ev] = [f];
            // contains is for searching the handler; it is a method
            handlers[ev].contains = Handler.prototype.contains;
        }

        emitter.log("on", ev, proto, f, context); 

        return f;

    }

[doc]() 

    ### on(str ev, Handler f, obj context) --> Handler

    Associates handler f with event ev for firing when ev is emitted.

    __arguments__

    * `ev` The event string on which to call handler f
    * `f` The handler f. This can be a function, an action string, an array of
      handler types, or a handler itself.
    * `context` What the `this` should be set to when invoking f. Defaults to
      `null`.

    __return__

    The Handler which should be used in `.off` to remove the handler, if
    desired.

    __f__

    Ultimately handlers execute functions. These functions will be passed in
    the data from the emit and an [event object](#evobj). It will be called in
    the passed in context

    __example__

        var record = {};
        emitter.on("json received", function(data) {
           this.json = JSON.parse(data);
        }, record);

#### Off

This removes handlers. The nowhen boolean, when true, will leave the when
handlers on the when events. This effectively blocks those events from
happening until some manual reworking on the event. Since the no argument
function wipes out all handlers, period, we do not need to worry about nowhen.


    function (events, fun, nowhen) {

        var emitter = this;
        
        var handlers = emitter._handlers;
        var h, f;

        if ( (events == null) && (fun == null) ) {
            emitter._handlers = {};
            emitter.log("all handlers removed from all events");
            return emitter;
        }

        if (events == null) {
            events = Object.keys(emitter._handlers);
        } else if (typeof events === "string") {
            events = [events];
        } else if (typeof events === "function") {
            events = Object.keys(emitter._handlers).filter(events);
        } else if (events instanceof RegExp) {
            events = Object.keys(emitter._handlers).filter(
                function (el) {
                    return events.test(el);
            });
        }

        if ( typeof fun === "boolean") {
            nowhen = fun;
            fun = null;
        }

        if (fun) {
            events.forEach( function (ev) {
                var removed = [];
                _":remove handler"
                emitter.log("handler for event removed", ev, removed);
            });
            return emitter;    
        } 

        events.forEach( function (ev) {
            if (nowhen === true) {
                delete handlers[ev];
                emitter.log("removed handlers on event ignoring when", ev); 
                return emitter;
            } else {
                _":remove handlers checking for when handlers"
                emitter.log("removing all handlers on event", ev);
            }            
        });
        
        return emitter;
    }          
 

[remove handler](# "js")

This will remove all handlers that are or contain the passed in fun. 

Note that this could get messy in the case of multiple functions embedded in
one handler; this will remove them if a single function is queued to be
removed. Think of this more of as a partial match removal. Not sure if this is
a good idea or not. Need to test how it interacts with .when. Proobably bad if
several handlers with same tracker in the list. 

    handlers[ev] = handlers[ev].filter(function (handler) {
        if (handler.contains(fun) ) {
            removed.push(handler);
            return false;
        } else {
            return true;
        }
    }); 
    if (nowhen !== true)  {
        removed.forEach(function (el) {
            el.removal(ev, emitter);
        });
    }



[remove handlers checking for when handlers](# "js")

The main issue here is removing .when trackers.
    
    h = handlers[ev];
    while (h.length > 0) {
        f = h.pop();
        f.removal(ev, emitter);
    }
    delete handlers[ev];


[doc]()

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

    Emitter for chaining. 

    __example__

        _":example"

[example]()

    // removes f from "full:bob"
    emitter.off("full:bob", f);
    // removes all handlers to all events with :bob as last 
    emitter.off(/\:bob$/);
    // removes all listed events
    emitter.off(["first", "second"], f);
    // function filter
    emitter.off(function (ev) { return (ev === "what");}, f);


#### Once

This method produces a wrapper around a provided handler that automatically
removes the handler after a certain number of event firings (once is
default).  The new handler is what is returned.

The way it works is the f is put into a handler object. This handler object
then has a function placed as the first to be invoked. When invoked, it will
decrement the number of times and remove the handler if it is less than or
equal to 0. That's it. No function wrapping in a function.

We allow for n and context to be switched. Minimal risk of unintended
consequences. 

    function (ev, f, n, context) {
        var emitter = this, 
            handler, g, temp;

        handler = new Handler([f], context);

        _":switch vars"

        if (typeof n === "undefined") {
            handler.n = n = 1;
        } else {
            handler.n = n;
        }

        g = function() {
            if (handler.n >= 1) {
                handler.n -=1;
            } else {
                emitter.off(ev, handler);
                return true;
            }
        };

        handler.value.unshift(g);

        emitter.on(ev, handler); 

        emitter.log("once", ev, n, f, context, handler);

        return handler;
    }

[doc]()

    ### once(str event, handler f, int n, obj context) --> handler h

    This attaches the handler f to fire when event is emitted. But it is
    tracked to be removed after firing n times. Given its name, the default n
    is 1.

    __arguments__

    * event Any string. The event that is being listened for.
    * f Anything of handler type. 
    * n The number of times to fire. Should be a positive integer. 
    * context The object whose `this` f should have. 

    Both n and context are optional and their positioning can be either way. 

    __return__

    The handler that contains both f and the counter.

    __example__

        _":example"

[switch vars]()

If needed, we switch n and context

    if ( (typeof n !== "number") && (typeof context === "number") ) {
        temp = n;
        n = context;
        context = temp;
    }

[example]()

    // talk with bob just once when event "bob" happens
    // this will be the object brief
    emitter.once("bob", "talk with bob", brief);
    // talk with jack three times, using brief each time
    emitter.once("jack", "talk with jack", 3, brief);

#### When

This is a key innovation. The idea is that once this is called, a handler is
created that attaches to all the listed events and takes care of figuring
when they have all called. 

When all the events have fired, then the given event emits with a data
object that is an array  of all the fired event's data, specifically the
array elements are arrays of the form `[event name, data]`. 

The return is the tracker which contains all things that might need to be
accessed. It also contains the remove methods to cancel the `.when`.

It has the argument of timing used to time the emitting of the event to be
fired. The argument reset allows for reseting to the initial state once
fired. 

Emitting scoped events will count also as a firing of the parents, e.g.,
`.when([["button", 3], "disable")` will have `.emit("button:submit")` remove
one of the button counts (unless event bubbling is stopped). But
`.emit("button")` will not count for any `.when("button:submit")`. 


    function (events, ev, timing, reset) {    

        var emitter = this;

        var tracker = new Tracker ();

        tracker.emitter = emitter;
        tracker.ev = ev;
        tracker.data = [];
        _":assign timing reset"
        tracker.original = events.slice();
        tracker.idempotent = false;

        var handler = new Handler (function (data, evObj) {
            var ev = evObj.cur[0];
            if (typeof data !== "undefined") {
                this.data.push([ev, data]);
            }
            this.remove(ev);
        }, tracker);

        handler.tracker = tracker;

        handler._label = "tracker";

        tracker.handler = handler; 

        tracker.add(events);

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



[doc]()


    ### when(arr/str events, str ev, str timing, bool reset ) --> tracker 

    This is how to do some action after several different events have all
    fired. Firing order is irrelevant.

    __arguments__

    * `events` A string or an array of strings. These represent the events
      that need to be fired before emitting the event `ev`. The array
      could also contain a numbered event which is of the form `[event, # of
      times]`. This will countdown the number of times the event fires
      before considering it done. 
    * `ev` This is the event that gets emitted after all the events have
      taken place. It should be an event string.
    * `timing` Emits `ev` based on the timing provided, as in `.emit`.
    * `reset` Setting this to true will cause this setup to be setup again
      once fired. The original events array is saved and restored. Default
      is false. This can also be changed after initialization by setting
      tracker.reset. 

    __return__

    Tracker object. This is what one can use to manipulate the sequence of
    events. See [Tracker type](#tracker)

    __note__

    If an event fires more times than is counted and later the when is
    reset, those extra times do not get counted. 

    __example__

        _":example"

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
    emitter.emit("db returned", dbobj);
    emitter.emit("file read", fileobj);
    
    

#### Action

This is for storing Handler type objects under a name string, generally some
active description of what is supposed to take place. The Handler type can be
anything that converts to Handler. 

If just one argument is provided, then the handler is returned. 

If two arguments are provided, but the second is null, then this is a signal
to delete the action. 


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
            emitter.log("removed action", name);
            return name;
        }
        
        var action = new Handler(handler, context); 

        if (emitter._actions.hasOwnProperty(name) ) {
            emitter.log("overwriting action", name, handler,
                emitter._actions[name], action);
        } else {
            emitter.log("creating action", name, handler, 
                context, action); 
        }

        emitter._actions[name] = action;

        return action;
    }

We return the name so that one can define an action and then use it. 

[filter]()

This allows for filtering of the action handlers.

    filter(emitter._actions, name)

[doc]() 

    ### action(str name, handler, obj context) --> action handler

    This allows one to associate a string with a handler for easier naming. It
    should be active voice to distinguish from event strings.

    __arguments__

    * `name` This is the action name.
    * `handler` This is the handler-type object to associate with the action. 
    * `context` The context to call the handler in. 

    __return__

    * 0 arguments. Returns the whole list of defined actions.
    * 1 argument. Returns the handler associated with the action.
    * 2 arguments, second null. Deletes associated action.
    * 2, 3 arguments. Returns created handler that is now linked to action
      string. 

    __example__

    This example demonstrates that an action should be an action sentence
    followed by something that does that action. Here the emit event sends a
    doc string to be compiled. It does so, gets stored, and then the emitter
    emits it when all done. Note files is the context that the handler is
    called in. 

        emitter.action("compile document", function (doc, evObj) {
            var files = this;
            var doneDoc = compile(doc);
            files.push(doneDoc);
            evObj.emitter.emit("document compiled", doneDoc);
        }, files);

#### Actions

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


#### Looper

This implements the looping over the queue. It is designed to avoid recursive
stack calls. To do this, we keep track of whether we are looping or not in the
emitter._looping variable. This should only get called if that flag is false. 

For example, A is emittted and stats the loop. A emits B which then sees that
the loop is active and does not call the loop. B does get queued and after the
first handler of A finishes, the queue is consulted again.  This continues
progress through the queue. We use either setTimeout (browser) or nextTick
(node) to allow for other stuff to happen in between each 1000 calls.

As looper is called without context, we have bound it function to the
emitter instance. 

For the `.soon`, `.later` commands, we use a waiting queue. As soon as next
tick is called, it unloads the first one onto the queue, regardless of
whether there is something else there. This ensures that we make progress
through the queue.

    function (caller) {
        var emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting,
            loopMax = emitter.loopMax,
            self = emitter.looper,
            loop = 0, 
            f, ev, evObj, events, cur, ind;


        if (emitter._looping) {
            emitter.log("looping called again", caller);
            return;
        }

        if ( (queue.length === 0) && (waiting.length > 0) ) {
            queue.push(waiting.shift());
        }


        emitter._looping = true;

        while ( (queue.length) && (loop < loopMax ) ) {
            _"act"
            loop += 1;
        }

        emitter._looping = false;

        if (queue.length) {
            emitter.log("looping hit max", loop);
            queue[0].again = true;
            emitter.nextTick(self);
        } else if ( waiting.length ) {
            emitter.nextTick(self);
        }

        if (caller) {
            emitter.log("loop ended", caller, loop);
        }

        return emitter;

    }


##### Act

This is to execute a single handler on the event queue. 

!! Consider the impact of evObj.unseen and again checks on performance.
Presumably okay, but does happen on every loop. 
    
    evObj = queue[0];
    events = evObj.events;

    if (evObj.unseen) {
        emitter.log("seeing new event", evObj.ev, evObj);
        delete evObj.unseen;
        delete evObj.again;
    } else if (evObj.again) {
        emitter.log("seeing event again", evObj.ev, evObj);
        delete evObj.again; 
    }

    

    if (events.length === 0) {
        queue.shift();
        continue;
    }


    cur = events[0]; 

    if (events[0][1].length === 0) {
        events.shift();
        continue;
    }

    ev = cur[0];
    f = cur[1].shift();
    if (f) {
        evObj.cur = [ev, f];
        emitter.log("firing", ev, f, evObj);
        f.execute(evObj.data, evObj);
        emitter.log("fired", ev, f, evObj);
        _":deal with stopping"

    }


[deal with stopping]()

If f modifies the passed in second argument to include stop:true, then the
event emission stops. This includes the current remaining handlers for that
scope's events as well as all remaining bubbling up levels. 

We remove the event from the queue. Since the queue may have changed, we find
it carefully.

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

Clear queued up events. 

    function (a, neg) {
        var queue = this._queue,
            waiting = this._waiting,
            emitter = this,
            ev, rw, rq; 

        if (arguments.length === 0) {
            rq = queue.splice(0, queue.length);
            rw = waiting.splice(0, waiting.length);
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
    waiting.forEach(filt);
    temp.unshift(0, waiting.length);
    rw = waiting.splice.apply(waiting, temp);
    emitter.log("some events stopped", a, rq, rw);



[doc]() 

    ### stop(filter toRemove, bool neg) --> emitter

    This is a general purpose maintainer of the queue/waiting lists. It will
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
    

#### Error

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
        throw Error(e);
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


#### MakeLog

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
            fdesc = {_"logs"},
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


#### Events

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

#### Handlers

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
    * `events`. If function, reg, or string, then events are genertaed by
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


### Handler

This is where we define handlers.

The idea is that we will encapsulate all handlers into a handler object.
When a function or something else is passed into .on and the others, it will
be converted into a handler object and that object gets returned. If a
handler object is passed in, then it may get wrapped or it may not.

This is a constructor and it should return `this` in most cases. 

If the passed in is a handler with no new context, then it gets returned as
is.  Otherwise, we take the handler's value and use it as the value but give
it a new context.

A handler can have a context. The closest context to an executing handler
will be used. This is why if it is a handler, we need to grab the value and
attach it to the new handler with its own context. 

    function (value, context) {
        if (value instanceof Handler) { 
             if (typeof context === "undefined") {
                return value;
             } else {
                this.value = value.value;
                this.context = context;
                return this;
             }
        }

        var handler = this;

        handler.value = value; 
        handler.context = context;

        return handler;
    }

[prototype]()

The prototype object.

* contains Returns a boolean indicating whether the given handler type is
  contained in the handler. 
* execute Executes the handler
* summarize Goes level by level summarizing the structure of the handler
* removal Removes any of the handler bits that are attached to .when
  trackers.

---
    Handler.prototype.execute = _"execute"; 
    Handler.prototype.contains = _"contains";
    Handler.prototype.summarize = _"summarize";
    Handler.prototype.removal = _"removal";

[doc]()

    Handlers are the objects that respond to emitted events. Generally they
    wrap handler type objects. 

    ### Handler types

    * function  `context -> f(data, evObj)` This is the foundation as
      functions are the ones that execute.  They are called with parameters
      `data` that can be passed into the emit call and `evObj` which has a
      variety of properties. See <a href="#evObj">evObj</a>.
    * string.  This is an action string. When executed, it will look up the
      action associated with that string and execute that handler. If no
      such action exists, that gets logged and nothing else happens.
    * handler. Handlers can contain handlers.
    * array of handler types. Each one gets executed. This is how `.once`
      works.

    ### Handler methods
   
    These are largely internally used, but they can be used externally.

    * [summarize](#summarize)
    * [execute](#execute)
    * [removal](#removal)
    * [contains](#contains)

    ---
    <a name="summarize"></a>
    _"summarize:doc"
    
    ---
    <a name="execute"></a>
    _"execute:doc"
    
    ---
    <a name="removal"></a>
    _"removal:doc"

    ---
    <a name="contains"></a>
    _"contains:doc"

#### Removal

This is to remove the tracking of a .when event in conjunction with the .off
method.

    function me (ev, emitter, htype) {
        var actions = emitter._actions;
        
        htype = htype || this;

        if ( htype.hasOwnProperty("tracker") ) {
            htype.tracker._removeStr(ev);
            emitter.log("untracked", ev, htype.tracker, htype);
            return ;
        }

        if (typeof htype === "string") {
            if (actions.hasOwnProperty(htype) ) {
                actions[htype].removal(ev, emitter);
            }
            return;
        }

The tracker is not attached to a function, but to a Handler object.

        if (typeof htype === "function") {
            return; 
        }

        if ( Array.isArray(htype) ) {
            htype.forEach(function (el) {
                me.call(empty, ev, emitter, el);
                return;
            });
        }


        if ( htype.hasOwnProperty("value") ) {
            me.call(empty, ev, emitter, htype.value); 
            return;
        } 

        emitter.log("unreachable reached", "removal", ev, htype);

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

#### Contains

This will search for the given possible target to determine if the Handler
contains it. 

This is used as a method of proper Handler types, but we can't call it as a
method in general because strings become objectified if they are called in
context. 


    function me (target, htype) {

        if ( (htype === target) || (this === target) ) {
            return true;
        }

        htype = htype || this;
               
        if ( Array.isArray(htype) ) {
            return htype.some(function (el) {
                return me.call(empty, target, el);
            });
        }

        if ( htype.hasOwnProperty("value")) {
            return me.call(empty, target, htype.value);
        } 

        return false;

    }

[doc]() 

    #### contains(target, htype) --> bool

    This checks to see whether target is contained in the handler type at
    some point.
    
    __arguments__

    * `target` Anything of handler type that is to be matched.
    * `htype` Anything of handler type. This is the current level. If
      `htype` is not provided (typically the case in external calling), then
      the `this` becomes `htype`. 

    __return__ 
    
    It returns true if found; false otherwise.

    __example__

        handler.contains(f);
        handler.contains("act");

#### Execute

Here we handle executing a handler. We could have a variety of values here.

* string. This should be an action. We lookup the action and use the
  function. 
* function. Classic. It gets called.
* handler. This is an object of type handler and how we will always start.
  We iterate through handlers to find executable types.
* [possible handler types...]. The array form gets executed in order, be it
  functions, actions, or Handlers. The array can contain Handler objects
  that are then handled. 

We pass in data, event object, and context; the value is for internal
calling, for the most part. 

All of the handlers are encapsulated in a try...catch that then calls the
emitter's .error method (which can be overwritten). The default will rethrow
the error with more information. The error is likely to be called multiple
times if throwing is kept being done. Maybe should think about that.  

evObj.stop is the flag to set to stop execution for the rest of the event's
handlers. To just stop the cascade for a given handler (see once), return
true. 

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
                    emitter.log("executing action", value, context, evObj);
                    return actions[value].execute(data, evObj, context);
                } else {
                    emitter.log("action not found", value, evObj);
                    return false;
                }
            }

            if (typeof value === "function") {
                emitter.log("executing function", value, context, 
                    evObj);
                return value.call(context, data, evObj);
            }

            if ( Array.isArray(value) ) {
                return value.some(function (el) {
                    return me.call(empty, data, evObj, context, el); 
                });
            }

            if ( typeof value.execute === "function" ) {
                return value.execute(data, evObj, context);
            }   

            emitter.log("value not executable", value, evObj);

        } catch (e) {
            emitter.error(e, value, data, evObj, context);
        }

        return false;
    }

[doc]()

    #### execute(data, evObj, context, value) --> 

    This executes the handler. 

    __arguments__

    * `data`, `evObj` get passed into the functions as first and second
      arguments. This is generated by the emit. 
    * `context` The closest context will be used. If the function is bound,
      that obviously takes precedence.
    * `value` This is largely internally used. 

    __return__

    Nothing. 

    __example__

        handler = new Handler(function () {console.log(this.name, data);},
            {name: "test"});
        handler.execute("cool", {emitter:emitter});


#### Summarize

This tries to report the structure of the handlers. We use the property
name "_label" for the tag to return for any given level.

For functions, we use their given name 

    function me (value) {
        var ret, lead;

        if (typeof value === "undefined" ) {     
            value = this;
        }

       if (typeof value === "string") {
            return "a:" + value;
        }

        if (typeof value === "function") {
            return serial(value);
        }

        if ( Array.isArray(value) ) {
            ret = value.map(function (el) {
                return me.call(empty, el);
            });
            lead = value._label || "";
            return lead + "[" + ret.join(", ") + "]";
        }

        if ( value && typeof value.summarize === "function" ) {
            ret = me.call(empty, value.value);
            lead = value._label || "";
            return "h:" + lead + " " + ret;
        } 

        return "unknown";

        }

[doc]()

    #### summarize(value) --> str

    This takes a handler and summarizes its structure. To give a meaningful
    string to handlers for a summarize, one can add `._label` properties to
    any of the value types except action strings which are their own "label". 

    __arguments__

     * `value` or `this` is to be of handler type and is what is being
      summarized. 

    __return__

    The summary string.

    __example__

        handler.summarize();

#### Make Handler

This is a simple wrapper for new Handler

    function (value, context) {
        return new Handler(value, context);
    }

[doc]()

    ### makeHandler(value, context) --> handler

    Create a handler. 

    __arguments__

    * `value` The handler type to wrap.
    * `context` What the `this` should be for calling the handler.

    __example__

        emitter.makeHandler(function yay () {}, obj);

### Tracker

The tracker object is used to track all the data and what events are
available. Controlling it controls the queue of the when emit. 

    function () {
        this.events = {};
        return this;
    }


[prototype](# "js")

THe various prototype methods for the tracker object. 

    Tracker.prototype.add = _"add";
    Tracker.prototype.remove = Tracker.prototype.rem = _"remove";
    Tracker.prototype._removeStr = _"remove string";
    Tracker.prototype.go = _"go";
    Tracker.prototype.cancel = _"cancel";
    Tracker.prototype.reinitialize = _"reinitialize";

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

We can add events on to the tracker. We allow it to be an array of events
passed in or a bunch of strings passed in as parameters.

    function (newEvents) {
        var tracker = this,
            events = tracker.events,
            handler = tracker.handler;

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

[doc]()

    Add events to tracking list.

    __arguments__

    This is the same form as the `events` option of `.when`. It can be a
    string or an array of [strings / array of [string, number] ]. A string is
    interpreted as an event to be tracked; a number indicates how many times
    (additional times) to wait for.

    You can use this to add a number of wait times to an existing event.

    __example__
    
        t.add("neat");
        t.add(["neat", "some"]);
        t.add([["some", 4]]);

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

        delete tracker.events[ev];

        tracker.go();
        return tracker;
    }

#### Go

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
                tracker.reinitialize();
            } else if (tracker.idempotent === false) {
                tracker.go = noop;
            }
            emitter.emit(ev, data, tracker.timing); 
        }
        return tracker;
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

        tracker.cancel();
        tracker.add(tracker.original);
        if (tracker.go === noop) {
            delete tracker.go; //restores to prototype
        }
        tracker.go();
        return tracker;
    }

[doc]()

    Reinitializes the tracker. The existing waiting events get cleared and
    replaced with the original events array. All data is wiped. No arguments.  
    

### Logs 

This is where we keep track of the log statements and what to do with them. 


    "emit" : function (ev, data, timing, evObj) {
        return evObj.count + ". Event " + se(ev) + " emitted" + 
            ( (typeof data !== "undefined") ? 
                " with data " + s(data) :
                "" ) +
            ( (timing !== emitter.timing) ? " with timing " + 
                se(timing) : "" );
    },
  
    "restoring normal emit" : function () {
        return "Last monitor removed, emit restored";
    },

    "wrapping emit" : function (filt, listener) {
        return "Creating monitor " + s(filt, listener);
    },

    
    "removing wrapper" : function (filt) {
        return "Removing monitor " + s(filt.filt, filt[1]);
    },

    "attempted removal of wrapper failed": function(filt){
        return "Failed to find/remove monitor " + s(filt);
    },

    "intercepting event" : function ( ev, data, filt){
        return "Intercepted event " + se(ev) +
               ( (typeof data !== "undefined") ? 
                " with data " + s(data) :
                "" ) +
            " with monitor " + s(filt.filt, filt[1]);
    },

    "stopping event" : function(ev, data, filt) {
        return "Stopping event " + se(ev) +
            " because of monitor " + s(filt.filt, filt[1]);
    },

    "deleting scope event" : function (ev, scope) {
        return "Scope event removed " + se(ev) + " " + s(scope);
    },

    "overwriting scope event" : function(ev, obj, scope) {
        return "Changing the scope of " + se(ev) + " from " +
            s(scope) + " to " + s(obj);
    }, 

    "creating scope event" : function (ev, obj) {
        return "Event " + se(ev) + " now has a scope " + s(obj); 
    },

    "on" : function (ev, proto, f, context) {
        return "Attaching " + s(proto) + " to event " + se(ev) + 
            ( context ?  " with context " + s(context) : "" ); 
    },

    "all handlers removed from all events" : function () {
        return "Wiped out all handlers from all events";
    }, 

    "handler for event removed" : function (ev, removed) {
        return "Removed handler " + 
            se(removed.map(function (el) {return el.summarize();})) +
            " from " + se(ev);
    },

    "removed handlers on event ignoring when" : function (ev) {
        return "Removing handlers for " + se(ev);
    },

    "removing all handlers on event" : function (ev) {
        return "Removing handlers for " + se(ev);
    },

    "once" : function(ev, n, proto, context) {
        return "Attaching " + s(proto) + " to event " + se(ev) + 
            "for " + se(n) + " time" + ( (n > 1) ? "s" : "" ) +   
            ( context ?  " with context " + s(context) : "" ); 
    },


    "when" : function (events, ev, timing, reset) {
        return "Will emit " + se(ev) + 
            " when the following have fired: " + 
            se(events) + 
            ( timing ? " with timing " + s(timing) : "" ) +
            ( reset ? " will reset" : "" ); 
    },
    
    "removed action" : function(name) {
        return "Removing action " + se(name);
    },
    
    "overwriting action" : function (name, proto) {
        return "Overwiting " + se(name) + " with new " + s(proto);
    },

    "creating action" : function(name, proto, context) {
        return "Creating action " + se(name) +
            " with function " + s(proto) + 
            ( context ?  " with context " + s(context) : "" ); 
    },


    "emission stopped" : function (ev) {
        return "Event " + se(ev) + " emission stopped";
    },

    "queue cleared of all events" : function () {
        return "Currently queued events for emitting have all been removed";
    },

    "event cleared" : function (ev) {
        return "Event " + se(ev) + " cleared from queue";
    },

    "some events stopped" : function(a, rq, rw) {
        
        var qlist = rq.map(function (el) {
            return el.ev;
        }); 

        var wlist = rw.map(function (el) {
            return el.ev;
        });  

        return "Events stopped per filter " + se(a) + 
            "resulting in the elimination of " + 
            s(qlist) + " and " + s(wlist);
    },

    "error raised" : function(e, handler, data, evObj, context) {
        _":error"
        return err;
    },
    
    "executing action" : function ( value, context, evObj) {
        return evObj.count + ") " + 
            "Executing action " + se(value) +
            " for event " +
            se(evObj.cur[0]) +
            ( context ?  " with context " + s(context) : "" ); 
    },

    "action not found" : function (value, evObj) {
        return  evObj.count + ") " + 
            " Event " +
            se(evObj.cur[0]) + 
            " requested action " + se(value) + " but action not found";
    },

    "executing function" : function (value, context, evObj) {
        var f = se(value);
        if (f === "``") {
            return ;
        }
        return evObj.count + ") " + 
            "Executing function " + f + 
            " for event " + 
            se(evObj.cur[0]) + 
            ( context ?  " with context " + s(context) : "" ); 
    },

    "canceling tracker" : function (tracker) {
        return "Canceling watcher " + s(tracker);
    }

[error]()

This code is also present in default error method with the string being
console.logged.

    var err = "error " + e + "\n\n" +
        "event " + 
        ( (evObj.ev === evObj.cur[0] ) ?
            s(evObj.ev) :
            s(evObj.ev, evObj.cur[0]) ) + 
        "\nhandler " + s(handler) + 
        "\ndata " + s(data) + 
        "\ncontext " + s(context) + 
        "\nscopes " + s(evObj.scopes);

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

### Cycle

This is a modified form  of Crockford's JSON 
[cycle.js](https://github.com/douglascrockford/JSON-js/blob/master/cycle.js)
It was released as public domain, 2013-02-19 with no warranty.

My main modification involves catching functions and replacing them with an
object of the form `{$fun:label}` where the label is found in the function
_label property. If no label is found, then the function is ignored. If an
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

typeof null === 'object', so go on if this value is really an object but not
one of the weird builtin objects.

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
custom type stored in _type which will have a $ appended in front. 

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


## README

The readme for this. A lot of the pieces come from the doc sections.

    ## event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

    _"introduction:doc"

    ### Object Types

    * [Emitter](#emitter). This module exports a single function, the
      constructor for this type. It is what handles managing all the events.
      It could also be called Dispatcher. 
    * [Handler](#handler) This is the object type that interfaces between
      event/emits and action/functions. 
    * [Tracker](#tracker) This is what tracks the status of when to fire
      `.when` events.


    ### Method specification

    These are methods on the emitter object. 

    * [emit](#emit)
    * [monitor](#monitor)
    * [when](#when)
    * [on](#on)
    * [off](#off)
    * [once](#once)
    * [stop](#stop)
    * [action](#action)
    * [actions](#actions)
    * [scope](#scope)
    * [scopes](#scopes)
    * [events](#events)
    * [handlers](#handlers)
    * [error](#error)
    * [makeLog](#log)
    * [makeHandler](#makehandler)
    * [filter](#filt)
    * [serial](#serial)

    ---
    <a name="emit"></a>
    _"emit:doc"
    
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
    <a name="log"></a>
    _"makelog:doc"
    
    ---
    <a name="makehandler"></a>
    _"make handler:doc"

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
    ### Event Object
    <a name="#evobj"></a>
    _"event object"

    ___
    ### Filter Type
    <a name="#filter"></a>
    _"filter:doc"



## old README

 ##event-when  [![Build Status](https://travis-ci.org/jostylr/event-when.png)](https://travis-ci.org/jostylr/event-when)

NOTE: Major rewrite in progress. The readme here refers to the current npm
 version, not to this repository. See newReadme for what's cooking. 

Install using `npm install event-when`

Then you can `EventWhen = require('event-when');` and use `evw = new
EventWhen()` to create a new instance of this class. 

It is a node module that allows you to create object with event methods.
Fairly standard stuff with the exception of the `.when` method which resolves
the problem of how to keep track of when to fire an event that has to wait for
other events.  That is, it allows several events to feed into one event being
emitted. 

As an example, let's say you need to read/parse a file ("file parsed") and get
some data from a database ("db parsed"). Both events can happen in either
order. Once both are done, then the "data is ready".

We can implement this with  `evw.when(["file parsed", "db parsed"], "data is
ready" );` 

Nifty!


 ### Methods

The simplest example of a handler is a function, but it could also be an
action name, event string to be emitted, a Handler object, or an array of such
things that could also contain arrays of the form `[that, fun, arg]` where
`that` is the context, `fun` is the function to fire, and `arg` is some data
to be passed into the third argument of `fun`. The first two arguments of
`fun` are the data for the event and the emitter itself; there is a fourth
argument that is the event string itself (which is surprisingly useful at
times).

* .emit(str event, [obj data] ). Invokes all attached functions to Event,
  passing in the Data object, emitter object itself, and event string as the
  three arguments to the attached functions. 
* .later(str event, [obj data], [bool first] ).  Queues the event for emitting
  on next tick (or so). If first is true, then it puts the event ahead of
  others in line for emitting. Other than timing, same as .emit.
* .when([fired events], Handler,  options ) This has similar semantics as emit
  except the [fired events] array has a series of events that must occur (any
  order) before this event is emitted. The object data of each fired event is
  merged in with the others for the final data object -- the original is
  archived in the data object under `_archive`. This method returns a [tracker
  object](#tracker-object).

    Each fired event could be an array consisting of [event, number of times,
    bool first]. This allows for waiting for multiple times (such as waiting
    until a user clicks a button 10 times to intervene with anger management).  

    The second argument can be any [Handler-type](#handler-object). 
        
    The options argument has the following useful keys: 

    * that Will be the context for functions fired from ev
    * args Will be the arguments passed to such functions
    * timing Is the timing passed to emitting events. later and firstLater
      togger .later and .later(...true),  respectively. No timing or anything
      else triggers .emit
    * reset Should the .when parameters be reset to the initial state once
      fired?

* .on(str event, Handler--convertible, obj that, ? args, boolean first)
  Attaches a Handler object to the string  Event. The Handler is returned.
  Anything convertible to a Handler can be in the second slot. The Handler
  will be called in the context of `that` with `args` passed in as one of the
  arguments if those are present. The boolean first if present and TRUE will
  lead to the handle being pushed in front of the current handlers on the
  event. 
* .once(str event, fun handle, int n, obj that, ? args, bool first) This will
  fire the handler n times, default of 1 times. This is accomplishd by placing
  a counting function as the first function to execute; it removes the handler
  when it reaches 0, but it still executes. The post-n arguments are the same
  as in `.on`. Warning: If you passin a Handler from somewhere else, it will
  add the counting function to it which means it will decrement if something
  else calls it. You can always wrap a Handler in an array to avoid this. 
* .off(str event, fun handle) Removes function Handle from Event. The handler
  can be of type handler or a function, string, etc. If it is not a Handler,
  then it will only remove it if the Handler's value matches what is passed
  in, e.g., if you pass in function f then only if value matches [f] and not
  [f, g]. 
* .off(str event) Removes all function handlers on Event. 
* Both variants of .off above also have optional boolean that if true will
  prevent the removal of when handles from their tracker objects meaning those
  events may never fire. 
* .off()  Removes all events. Ouch. 
* .stop([str event/bool current]) Removes queued handlers either globally (no
  args), on an event (str given), or current (TRUE)
* .events(fun partial | str match, bool negate) It lists all events that have
  handlers. No arguments lead to all events being reported; if partial is a
  function, then it is used as a filter. If the match string is provided, then
  that is used to match with the negate boolean allowing a reversal of the
  selection for the function filter. 
* .handlers(arr events) If no arguments, it returns all events and their
  handlers. If there is an event listing, then it uses that list of keys to
  pull handlers. 
* .action(str name, handler, that, args) This stores a reference to a Handler
  in the action list. It can be invoked by simply using the name instead of
  the handler in any place where Handlers are accepted. 

If a function handler returns FALSE, then no further handlers from that event
emit incident will occur. 

Logging of single events can be done by passing an event logging function. To
log all events, attach a logging function via .log = function

 ### Tracker Object

The .when method creates a handler that has a `handler.tracker` object and
that tracker object has the following methods. This is what is returned from
that method. The handler itself is found in `tracker.handler`.

* .add(ev); .add(ev1, ev2, ...); .add([ev1, ev2, ...])  This method adds
  events to the array of events that should happen before firing. The event
  could be an array of event and number of times to fire as well as the
  boolean for placing it first. If an event already exists, this will
  increment its counter appropriately. 
* .remove(ev1, ev2, ...)  removes the event(s). Each one could be either a
  string or an array of `[ev, num]` specifying how many times to remove the
  event. 
* .cancel() This will remove the handler of the `.when` object and effectively
  removes this from ever being called. 

So concludes Trackers.

 ### Handler Object

The Handler type is what encapsulates what is being called. The handles to be
exceuted are storedin an array property called `.value`. It may have a `.name`
property (generated for actions, at the least),  `.that` for the context the
functions are called in, `.args` for a pass-in data into the function. 

The prototype has the method `.execute` which is internal and is what is
called to execute the handlers. 

You can pass in functions, strings, arrays of these things, arrays with an
array [context, function, args], and Handlers themselves.  

 ### .Error

Since we are controlling the flow, we can also control error throwing. So that
is what the emitter.error method does. All calls to handlers have their errors
caught and sent to the .error method. The default is to throw the error again
with the event string and handler name added to the error. 

## Benchmark

Here we benchmark the basic emit, handler code. This is presumably where
the most number of operations occurs. 

    
    /*global require, process, console */
    
    var n = process.argv[2] || 1e3;

    var i, time, c;

    var log = function (time, count, tag) {
        var diff = process.hrtime(time);
        console.log("##", tag);
        console.log("count", count);
        console.log('benchmark took ' + diff[0] + ' seconds and ' +
            diff[1]/1e6 + ' milliseconds');
    };

    _":first"
   
    _":second"

[first] ()


    var EvW = require('./index.js');
    var emitter = new EvW();

    emitter.loopMax = 2*n;

    c = 0;

    emitter.on("go", function () {
        c += 1;
    });
        
    time = process.hrtime();
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go");
    }

    log(time, c, "event-when");

[second]()

Native event emitter

 
        var EE = require("events").EventEmitter; 
 
        emitter = new EE();

        emitter.on("go", function () {
            c += 1;
        });

        time = process.hrtime();
        
        for (i = 0; i < n; i += 1) {
            emitter.emit("go");
        }

        log(time, c, "native");



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

At the very least, better documentation. I wrote this thing and find it hard
to figure out how to use it the way I want to. But I also think there might be
some inaccuracies. So I hope to fix this up. 

What I want is a very clear ability to use actions. I am also wondering about
scoping it. One could have separate event emitters or perhaps we can use one
which scopes an event to something, which could be a key string with an object
value that becomes available somehow. 

... So the scope thing is cool. It bubbles up with the possibility of events
being stopped. Each handler has access to the data at each of the scope
levels. So the general scope level can get a scope object from the specific. 

But the data for the handlers is getting complicated. So the callback
signature will be f(data, obj) where data is anything being passed along by
the event (for simple functions) while obj contains all the different
contexts, etc.  There is no this being bound; one can bind the function f if
you want a context, but this will not do anything. All needed stuff should be
in obj. 

So what will be in obj? The keys will be data (redundant, but...),  hanCon for
handler context, hanArgs for an array of "data" to pass in,  evObj, ev,
emitter, 

Thinking about .when only emitting events, not doing other handlers. I think
that makes it much cleaner to handle. Not sure why I included the other ways.
Maybe thought that having to define an event and then just one handler on it
seemed silly. But really, that's what events are about. 

---

Decided to jettison all the myth/data stuff and the passin object. Instead,
events emit data (a single object) and the context of arguments is either
provided by the handler or is the empty object. The second argument is the
event Object which should have the current scope too. The event definitions
will not have any distinct data -- this can be put in the handler's context if
needed. 

### Version 0.5.0 Thoughts

I have made a mess of the emit events. So here is the new paradigm. `.emit` is
equivalent to a function call. It gets called immediately and its sequence of
emits is followed as if they are function calls. The hope is that all the
handlers of an event emitted from within an emitted event sequence wil be done
completely before the rest of the original emit's handlers fire. 

`.later` is asynchronous mode. It will emit the events, in the order queued,
at the next tick. Each one happens after a next tick. So the entire sequence
from one emit event will happen before the next `.later` is called. I think I
will have an optional parameter to specify push vs unshift behavior with
default being push. 

Also, adding use of emitter.name in logs as well as numbering the emits called
for a given event. The string form for a handler will also lead to a log event
if no action/event fits. 

### Version 0.4.0 Thoughts

The idea is to create an action sentence that invokes the handler. So we
attach the sentence to the event and then stuff happens to that. The handler
can be a function or it could be an array of functions, etc. The point of
invocation is when the sentence is used as a key to get the handler. So this
allows dynamism which could be good, could be bad. The hard work, I think, is
to rewrite the handler calling to be abstracted out to another level. I
probably need to introduce an object of type handler. 

## gitignore

We should ignore node_modules (particularly the dev ones)

    node_modules
    ghpages

## npmignore

We should ignore test, examples, and .md files

    test
    examples
    *.md
    watcher.js
    mon.sh

## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "0.10"

## LICENSE MIT


The MIT License (MIT)
Copyright (c) 2013 James Taylor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
