# [event-when](# "version: 0.1.0 | jostylr")

This is my own little event library. It has most the usual methods and conventions, more or less. 

But the one feature that it has that I am not aware of in other libraries is the ability to fire an event after other events have fired. 

As an example, let's say you need to read/parse a file and get some data from a database. Both events can happen in either order. Once both are done, then the message gets formed and sent. This is not handled well in most event libraries, as far as I know. But what if we had a method called `.emitWhen("all data retrieved", ["file parsed", "database returned"])` which is to mean to block the event "all data retrieved" until both events "file parsed" and "database returned" have fired. 


## Files

The file structure is fairly simple. 

* [index.js](#main "save:|jshint") This is the node module entry point and only relevant file. It is a small file.
* [README.md](#readme "save:| clean raw") The standard README.
* [package.json](#npm-package "save: json  | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license.

## Main

This is the main structure of the module file.

    /*global setTimeout, process, module */
    var EvW = _"constructor";

    _"constructor:prototype"

    var Tracker = _"tracker";

    _"tracker:prototype"


    module.exports = EvW;

### Constructor

This manages an event emitter.

We use (not)private variables `_handlers` and `_queue` for the, well, handlers and queue of currently firing events. 

We bind resume to the instance since it will be passed in without context to the next function. 


    function () {
        var evw = this;

        this._handlers = {};
        this._queue = [];

        evw.resume = evw.resume.bind(evw);

        return this; 
    }

[prototype](# "js")

The various prototype methods on the event emitter. 

    EvW.prototype.on = _"on";
    EvW.prototype.emit = _"emit";
    EvW.prototype.off = _"off";
    EvW.prototype.stop = _"stop";
    EvW.prototype.resume = _"resume";
    EvW.prototype.emitWhen = _"emit when";

    EvW.prototype.next =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick : (function (f) {setTimeout(f, 0);});



### Emit

Given an event string, we run through the handlers, passing in the data to construct the array to be added to the queue. If immediate is TRUE, we put it at the top of the queue. Otherwise it goes at the end. 
    
    function (ev, data,  immediate) {


        if (this.log) {
            this.log("emit", ev, data, immediate);
        }


        var h = this._handlers[ev], q;

        if (h) {
            q = [ev, data || {}, [].concat(h)];
            if (immediate === true) {
                this._queue.unshift(q);
            } else {
                this._queue.push(q);
            }
            this.resume();
        }
        return this;
    }

### Emit When

This is the key innovation. The idea is that once this is called, a handler is created that attaches to all the listed events and takes care of figuring when they have all called. 

This handler is stored in the `.last` property (until the next handler assignment). The handler exposes methods to manage the addition and removal of the events. 

As each event fires, this handler merges in the data object to the existing data. It also stores the original data object in _archive[event name] = ... in the data object passed to the event for posterity, log recordings, and hacking. 

The immediate flag is passed on to emit with the event `ev` finally fires.

    function (ev, events, immediate) {    

        var emitter = this;    

        if (emitter.log) {
            emitter.log("emit when", ev, events, immediate);
        }

        var tracker = new Tracker();

        tracker.event = ev;
        tracker.emitter = emitter;
        tracker.immediate = immediate;

        var handler = function (data, fired) {
            tracker.addData(data, fired); 
            tracker.remove(fired);
            return true;
        };


        handler.tracker = tracker;

        tracker.handler = handler; 

        tracker.add(events);

        emitter.last = handler;

        return emitter;
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

We can add events on to the tracker.

    function (args) {
        var tracker = this,
            archive = tracker.data._archive,
            events = tracker.events,
            handle = tracker.handler;

        if (arguments.length !== 1) {
            args = [].concat(arguments);
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
            if (str && num) {
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

    function () {
        var tracker = this;

        if (Object.keys(tracker.events).length === 0) {
            tracker.emitter.emit(tracker.event, tracker.data, tracker.immediate);
        }

        return true;
    }




### On

Takes in an event and a function. It also has an optional this; if none specified, an empty object is used. If first is used, the function is put at the start of the (current) handler array. 

The function will be passed a data object and the event whose firing triggered. It will be called without context unless it is bound with .bind

    function (ev, f, first) {
        var handlers = this._handlers;
        if (handlers.hasOwnProperty(ev)) {
            if (first) {
                handlers[ev].unshift(f);
            } else {
                handlers[ev].push(f);
            }
        } else {
            handlers[ev] = [f];
        }

        this.last = f;

        return this;
    }


### Off

This removes handlers. The blockwhen boolean, when true, will leave the when handlers on the when events. This effectively blocks those events from happening until some manual reworking on the event. Since the no argument function wipes out all handlers, period, we do not need to worry here. 

    function (ev, fun, nowhen) {

        var handlers = this._handlers;
        var h, f;


        if (arguments.length === 0) {
            this._handlers = {};
            return this;
        }

        if (typeof fun === "function") {
            _":remove handler"
            return this;
        }

        if (typeof fun === "boolean") {
            nowhen = fun;
        }

        if (nowhen === true) {
            delete handlers[ev];
            return this;
        } else {
            _":remove handlers checking for when handlers"
        }            
        
        return this;
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


[remove handlers checking for when handlers](# "js")

    
    h = handlers[ev];
    while (h.length > 0) {
        f = h.pop();
        if (fun.hasOwnProperty("tracker") ) {
            fun.tracker.removeStr(ev);
        }
    }
    delete handlers[ev];



### Stop

Clear queued up events. Each element of the queue is an array of the [event name, data, [ handler,  ... ]]

* No args removes all events
* string arg  removes the event string
* true arg  removes the next element. 

---

    function (a) {
        var queue = this._queue;

        if (arguments.length === 0) {
            while (queue.length > 0 ) {
                queue.pop();
            }
        }

        if (typeof a === "string") {
            this._queue = queue.filter(function (el) {
                if (el === a) {
                    return false;
                } else {
                    return true;
                }
            });
        }


        if (a === true) {
            queue.shift();
        }

        return this;
    }

### Resume

This continues progress through the queue. We use either setTimeout (browser) or nextTick (node) to allow for other stuff to happen in between each handle call. 

As this is called without context, we return the resume function with an explicit binding to the instance instead of this. 

     function () {

        var q, f, ev, data, cont, cur; 
        var queue = this._queue;


        if (queue.length >0) {
            cur = queue[0];
            q = cur[2];
            f = q.shift();
            if (q.length === 0) {
                queue.shift();
            }
            if (f) {
                ev = cur[0];
                data = cur[1];
                if (f.log) {
                    f.log(ev, data);
                }
                cont = f(data, ev);
                if (cont === false) {
                    queue.shift(); 
                }
            }
            this.next(this.resume);
        }
    }



## README

 ##event-when

Install using `npm install event-when`

Then you can `EventWhen = require('event-when');` and use `evw = new EventWhen()` to create a new instance of this class. 

It is a node module that allows you to create object with event methods. Fairly standard stuff with the exception of the emitWhen method which resolves the problem of how to keep track of when to fire an event that has to wait for other events.  That is, it allows several events to feed into one event being emitted. 

As an example, let's say you need to read/parse a file ("file parsed") and get some data from a database ("db parsed"). Both events can happen in either order. Once both are done, then the "data is ready".

We can then implement this with  `evw.emitWhen("data is ready", ["file parsed", "db parsed"]);`


 ### Methods

 All methods return the object itself for chaining.

* .emit(str event, [obj data], [bool immediate] ). Invokes all attached functions to Event, passing in the Data object and event string as the two arguments to the attached functions. If third argument is a boolean and is TRUE, then the event is acted on immediately. Otherwise the event is invoked after current queue is cleared.
.emitWhen(str event, [fired events], [bool immediate] ) This has the same semantics as emit except the [fired events] array has a series of events that must occur (any order) before this event is emitted. The object data of each fired event is merged in with the others for the final data object. Each fired event could be an array consisting of [event, number of times, bool first]. This allows for waiting for multiple times (such as waiting until a user clicks a button 10 times to intervene with anger management). 
* .on(str event, fun handle, [bool first])  Attaches function Handle to the string  Event. The function gets stored in the .last property; (in case of anonymous function (maybe binding in progress), this might be useful). The boolean first if present and TRUE will lead to the handle being pushed in front of the current handlers on the event. 
* .off(str event, fun handle) Removes function Handle from Event. 
* .off(str event) Removes all function handlers on Event. 
* Both variants of .off above also have optional boolean that if true will prevent the removal of when handles from their tracker objects meaning those events may never fire. 
* .off()  Removes all events. Ouch. 
* .stop([str event/bool current]) Removes queued handlers either globally (no args), on an event (str given), or current (TRUE)

If a function handler returns FALSE, then event invoking stops on the handler. 

Logging of single events can be done by passing an event logging function. To log all events, attach a logging function via .log = function

Events will be converted to all lower case on lookup.

## TODO

implement .once  with an optional n parameter. wrap the function into a handler that keeps track and then removes itself. 

add in to emitwhen the option to have the event be a function called or an array of function/events. 

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
