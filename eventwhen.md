# [event-when](# "version: 0.1.0 | jostylr")

This is my own little event library. It has most the usual methods and conventions, more or less. 

But the one feature that it has that I am not aware of in other libraries is the ability to fire an event after other events have fired. 

As an example, let's say you need to read/parse a file and get some data from a database. Both events can happen in either order. Once both are done, then the message gets formed and sent. This is not handled well in most event libraries, as far as I know. But what if we had a method called `.emitWhen("all data retrieved", ["file parsed", "database returned"])` which is to mean to block the event "all data retrieved" until both events "file parsed" and "database returned" have fired. 


## Files

The file structure is fairly simple. 

* [index.js](#main "save:") This is the node module entry point and only relevant file. It is a small file.
* [README.md](#readme "save:| clean raw") The standard README.
* [package.json](#npm-package "save: json  | jshint") The requisite package file for a npm project. 
* [TODO.md](#todo "save: | clean raw") A list of growing and shrinking items todo.
* [LICENSE](#license-mit "save: | clean raw") The MIT license.

## Main

This is the main structure of the module file.

    var EvW = _"constructor";

    EvW.prototype.on = _"on";
    EvW.prototype.emit = _"emit";
    EvW.prototype.off = _"off";
    EvW.prototype.stop = _"stop";
    EvW.prototype.resume = _"resume";

    EvW.prototype.next =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick : (function (f) {setTimeout(f, 0);});

    EvW.prototype.dump = function () {
        return [handlers, queue, log];
    };




### Constructor

This manages a global queue of events. 

We will implement this by having a closure over an object whose keys are the event strings. We will also have an event queue.

We bind resume to this since it will be passed in without context to the next function. 

JS Main

    function () {

        var this._handlers = {};
        var this._queue = [];

        var this.resume = resume.bind(this);

        return this; 
    }


### Emit

Given an event string, we run through the handlers, passing in the data to construct the array to be added to the queue. If immediate is TRUE, we put it at the top of the queue. Otherwise it goes at the end. 
    
    function (ev, data,  immediate) {
        if (this.log) {
            this.log(ev, data, immediate, handlers[ev]);
        }

        ev = ev.toLowerCase();

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

This is the key innovation. The idea is that once this is called, handlers are created and attached to all events with 


### On

Takes in an event and a function. It also has an optional this; if none specified, an empty object is used. If first is used, the function is put at the start of the (current) handler array. 

    function (ev, f, first) {
        ev = ev.toLowerCase();
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

        return this;
    }


### Off

This removes handlers. 

    function (ev, fun) {

        var handlers = this._handlers;

        if (ev) {
            ev = ev.toLowerCase();
        }

        if (arguments.length === 0) {
            (_":empty object")(handlers);
        } if (arguments.length === 1) {
            delete handlers[ev];
        } if (arguments.length === 2) {
            _":remove handler"
        }

        return this;
    }

[empty object](# "js")

Just need to empty the object.

    function (obj) {
        var key; 
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                delete obj.key;
            }
        }
    }

[remove handler](# "js")

    handlers[ev] = handlers[ev].filter(function (el) {
        if (el === fun) {
            return false;
        } else {
            return true;
        }
    }); 



### Stop

Clear queued up events. Each element of the queue is an array of the [event name, data, [ handler,  ... ]]

* No args removes all events
* string arg  removes the event string
* true arg  removes the next element. 

---

    function (a) {
        var i, n; 
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
        var q, h, f, ev, data, cont, cur; 
        var queue = this._queue;

        console.log(queue.slice());
        if (queue.length >0) {
            cur = queue[0];
            q = cur[2];
            h = q.shift();
            if (q.length === 0) {
                queue.shift();
            }
            if (h) {
                f = h[0];
                ev = cur[0];
                data = cur[1];
                if (f.log) {
                    f.log(ev, data);
                }
                cont = f(data);
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

## TODO

Loads of stuff


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
