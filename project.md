# Event When

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
        emitter.when([["file parsed, "jack"], ["database returned", "jack"]],
            ["all data retrieved","jack"]);

        emitter.when(["file parsed, "database returned"],
            "all data retrieved", {scope: "jack"});

        ``` 
        
        This is why the idea of a central emitter is particularly useful to
        this library's intent.
    * [Scope](#scope). Events can be scoped. In the above example, each of
      the events are scoped based on the user jack. The emitter hosts a scope
      object where data for scopes can be stashed. 
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

The file structure is fairly simple. The main output is the index.js file and
the rest are all ancillary files. We read in most of the stuff from
`src/event-when.md`. 

### Loading

* [fevw](event-when.md "load:")  Main code
* [test](test.md "load:") Tests
* [examples](examples.md "load:") Examples for console

### Saving

* [../index.js](#main "save:|jshint") This is the node module entry point and
  only relevant file. 
* [index.js](#main "save:") This is for browser access. 
* [benchmark.js](#benchmark "save:|jshint") This is a very simple benchmark
  test.   
* [../README.md](#fevw::readme "save: ") The standard README, new version.
* [../testrunner.js](#test::testrunner "save: |jshint")

## Main

This is the main structure of the module file.


    /*jshint eqnull:true,esversion:6 */
    /*global setTimeout, setImmediate, module, console */

    ;(function () {

        var noop = function () {};

        let identity = a=>a;

        var filter = _"fevw::filter";

        var decycle = _"fevw::cycle:main";

        var serial = _"fevw::serial";

        var Handler = _"fevw::handler";

        _"fevw::handler:prototype"

        var Tracker = _"fevw::tracker";

        _"fevw::tracker:prototype"

        var EvW = _"fevw::constructor";

        _"fevw::constructor:prototype"

        if (module) {
            module.exports = EvW;
        } else {
            this.EventWhen = EvW;
        }

    } () );



## Benchmark

Here we benchmark the basic emit, handler code. This is presumably where
the most number of operations occurs. 

    
    /*jshint eqnull:true,esversion:6 */
    /*global require, process, console */
    
    var n = parseFloat(process.argv[2], 10) || 5e5;
    const EvW = require('./index.js');
    var EE = require("events").EventEmitter; 

    var i, time, c;

    var log = function (time, count, tag) {
        var diff = process.hrtime(time);
        console.log("##", tag);
        console.log("count", count);
        console.log('benchmark took ' + diff[0] + ' seconds and ' +
            diff[1]*1e-6 + ' milliseconds');
    };

    console.log(process.memoryUsage());

    c = 0;

    _":second"
    console.log(process.memoryUsage());
    
    c = 0;
    _":first"
    console.log(process.memoryUsage());
   
    _":evw scope"
    console.log(process.memoryUsage());

    _":evw embedded scope"
    console.log(process.memoryUsage());


[first]()


    var emitter = new EvW();

    emitter.loopMax = 2*n;


    emitter.on("go", "add 1", function count (num) {
        c += num;
    });
        
    time = process.hrtime();
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go", 1);
    }

    log(time, c, "event-when");


[evw scope]()


    emitter = new EvW();

    emitter.loopMax = 2*n;

    emitter.scope('c', {a:0});

    emitter.action('add', function count (num, scope, context) {
        context.a += num;
    });

    emitter.on("go", "add:c");
    
    time = process.hrtime();
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go", 1);
    }

    log(time, emitter.scope('c').a, "event-when scope");



[evw embedded scope]()


    emitter = new EvW();

    emitter.loopMax = 2*n;

    emitter.scope('numbers', {c:0});

    emitter.action('add', function count (num, s) {
        o = this.emitter.scope(s);
        o.c += num; 
    });

    emitter.on("go", "add");
    
    time = process.hrtime();

    let a = {c:1};
    
    for (i = 0; i < n; i += 1) {
        emitter.emit("go:numbers", 1);
    }

    log(time, emitter.scope('numbers').c, "event-when embedded scope");




[second]()

Native event emitter

 
 
        emitter = new EE();

        emitter.on("go", function (num) {
            c += num;
        });

        time = process.hrtime();
        
        for (i = 0; i < n; i += 1) {
            emitter.emit("go", 1);
        }

        log(time, c, "native");


## Use cases

Here we detail a variety of use cases. 

     1. Get info from different sources, then emit them all together. 

            gcd.when("file returned:dude!=>json", "db returned:dude",  
            gcd.fs.readFile("dude.json", "file returned:dude");
     
     2.  Translate data and uniformize from different sources:

            gcd.when(["mouse drag!oo=>xy", "keyboard press!oo=>kbxy"], "position
            given!oo=")

        This will listen, without blocking, for one of those events, pipe the
        raw event through a specific pipe, and then emit a unified event from
        that. It will emit for each. 



## Change Log


### Version 2

Version 1 had many events and scopes being fired from one emit. This was to
model it like the bubbling up of DOM events in the browser. But that is needed
in the browser because when one clicks on something, one is clicking on
multiple items and there is no way to see which one is the target. 

After working with event-when for awhile, such options are not needed. If they
are, one can always fire another event up the chain. 

Instead, we will drop to one event being emitted with one scope. The actions
can be triggered by the event and, optionally, in conjunction with a match of
the scope, either exact or not. 

This impacts the .when function to include those options as well.

The .when tracker should also end up with some functional enhancements that
allow one to manipulate the data array before it is sent along as an emitter.
This includes flattening it in some ways, reducing, mapping, etc. 

Actions should be emphasized with the written description action being
associated with a handler that takes in the data, the scope, the emitter, and
a context if provided. On and once need to have actions listed; a named
context is just a scope name as well. 

Debugging is hoped to be augmented with a better tracking of the relationships
between the events and actions. 

Also would like to add an ability to have a wait queue for (external) events
that adds to the queue of events for deciding when to emit an empty queue
event. 

The handlers are treated differently. Handlers that are attached at the time
of the emit will be used; there is no stopping them. As soon as the event is
emitted, once handlers will decrement even before they are fired. This ensures
they are called in the exact order of emitting. This also eliminates the need
for an array of functions, handlers, etc. Everything is simplified. 

Timing will be removed as well. All emit events are emitted in the order they
are encountered with the handlers being called in the order, from most
specific to general. 

Benchmark from version 1 on my 2017 iMac was 5e5 events at 430ms while native
events was 16 ms as done in benchmark.js (after converting the argument to a
number in the initialize phase instead of having it do that every iteration of
the loop -- oops). Also did a bit of memory investigation. For 5e5, the memory
increased by a third from before the event emitting; the native one had no
increase. 



### Version 1.3.0

Removed empty handlers and created .onces to track labelled onces to show they
did not get used up. No tests added :(

1.3.1: Added an array in onces of event, original count, and current count.

### Version 1.2.0

Introduced flat when

### Version 1.1.0

Added ability to order the data in .when according to initial creation
ordering, not event emitting ordering. Default is old behavior to avoid
breaking changes -- semver!


### Version 1.0.0 

Switching to semver kind of thinking. Now using it extensively in
literate-programming and it works well.

Added in .cache method. 

### Version 0.7.1

Better logs have been designed. 

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
