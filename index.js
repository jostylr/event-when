/*global setTimeout, process, module, console */
var EvW = function () {
    
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
    };

EvW.prototype.on = function (ev, f, data, myth) {
    var emitter = this,
        handlers = emitter._handlers;

    f = new Handler(f, data, myth ); 

    if (handlers.hasOwnProperty(ev)) {
            handlers[ev].push(f);
    } else {
        handlers[ev] = [f];
    }

    return f;

};
EvW.prototype.emit = function (ev, data, myth, type) {
        var emitter = this, 
            sep = emitter.scopeSep;
    
        type = type || "now";
    
        emitter.log("emit", ev, type, data, myth);
    
        var scopes = ev.split(sep);
    
        emitter.count += 1;
    
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
            count : emitter.count,
            contexts : contexts,
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
    };
EvW.prototype.eventLoader = function (type, evObj) {
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
    };
EvW.prototype.now = function (ev, data, myth) {
        var emitter = this;
        emitter.emit(ev, data, myth, "now");
        return emitter;
    };
EvW.prototype.momentary = function (ev, data, myth) {
        var emitter = this;
        emitter.emit(ev, data, myth, "momentary");
        return emitter;
    };
EvW.prototype.soon = function (ev, data, myth) {
        var emitter = this;
        emitter.emit(ev, data, myth, "soon");
        return emitter;
    };
EvW.prototype.later = function (ev, data, myth) {
        var emitter = this;
        emitter.emit(ev, data, myth, "later");
        return emitter;
    };
EvW.prototype.off = function (ev, fun, nowhen) {
    
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
            emitter.log("handler for event removed " +  ev + " :: " + (fun.name || "") );
            return emitter;
        }
    
        // harder -- check for handler whose value is one of these
        if (typeof fun === "function" || Array.isArray(fun) || typeof fun === "string") {
            handlers[ev] = handlers[ev].filter(function (el) {
                if ((el.value.length === 1) && (el.value[0] === fun)) {
                    return false;
                } else if (el.value === fun) {
                    return false;
                } else {
                    return true;
                }
            }); 
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
            h = handlers[ev];
            while (h.length > 0) {
                f = h.pop();
                if (f.hasOwnProperty("tracker") ) {
                    f.tracker.removeStr(ev);
                }
            }
            delete handlers[ev];
            emitter.log("removing handles on event", ev);
        }            
        
        return emitter;
    };
EvW.prototype.stop = function (a) {
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
    };
EvW.prototype.resume = function () {
        var q, f, ev, handlers, data, passin, evObj, events, 
            emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting, 
            resume = emitter.resume,
            counters = emitter.counters; 
        
        counters.resume += 1;
        counters.execute = 0;
    
        while ( (queue.length > 0 ) && (counters.loop <= counters.loopMax) ) {
            counters.loop += 1;
            evObj = queue[0];
            events = evObj.events;
            passin = {};
    
            events:
            while ( (events.length > 0) && (counters.loop <= counters.loopMax) ) {
                counters.loop += 1;
                ev = events[0].scopeEvent;
                handlers = events[0].handlers;
                while ( (ev.handlers.length > 0 ) && (counters.loop <= counters.loopMax) ) {
                    counters.loop += 1;
                    f = ev.handlers.shift();
                    if (f) {
                        passin = {
                                emitter : emitter,
                                scope : ev,
                                data : {
                                    emit : evObj.emitData,
                                    event : evObj.scopeData[ev],
                                    events : evObj.scopeData,
                                    handler : f.data
                                }
                                myth : {
                                    emit : evObj.emitMyth,
                                    event : evObj.scopeMyth[ev],
                                    events : evObj.scopeMyth,
                                    handler : f.myth                                
                                },
                                event : evObj.ev,
                                evObj : evObj,
                                handler : f
                            
                            };
                        emitter.log("firing", f, ev, evObj);
                        f.execute(data, passin);
                        emitter.log("fired", f.name,  ev, evObj);
                        if ( passin.stop === true ) {
                            events = [];
                            break events;
                        }
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
    
        if (counters.loop >= counters.loopMax) {
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
    
    };
EvW.prototype.when = function (events, ev, options) {    
    
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
    
        return tracker;
    };
EvW.prototype.once = function (ev, f, n, that, args, first) {
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
    };

EvW.prototype.next =  function (f) {
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
    
    };
EvW.prototype.nextTick =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick 
        : (function (f) {setTimeout(f, 0);});

EvW.prototype.log = function () {}; //noop stub
EvW.prototype.makeLog = function () {
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
    };
EvW.prototype.events = function (partial, negate) {
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
    
    };
EvW.prototype.handlers = function (events) {
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
    
    };
EvW.prototype.action = function (name, handler, that, args) {
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
    };
EvW.prototype.scope = function (ev, data, myth) {
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
            delete scope;
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
    };
EvW.prototype.makeHandler = function (value, options) {
        return new Handler(value, options);
    };
EvW.prototype.error = function (e, ev, h, i) {
        var name = h.name || "";
    
        throw Error(ev + ":" + name + (i ? "["+i+"]" : "") + "\n" + e.message);
    
    };

var Tracker = function () {
        this.events = {};
        this.data = {_archive : {} };
    
        return this;
    };

Tracker.prototype.add = function (args) {
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
};
Tracker.prototype.remove = function () {
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
    };
Tracker.prototype.removeStr = function (ev) {
        var tracker = this;
    
        delete tracker.events[ev];
    
        return tracker.go();
    };
Tracker.prototype.go = function () {
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
    };
Tracker.prototype.addData = function (eventData, event) {
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
    
    };
Tracker.prototype.cancel = function () {
        var tracker = this, 
            emitter = tracker.emitter,
            handler = tracker.handler,
            event, keys;
        
        keys = Object.keys(tracker.events);
    
        for (event in keys) {
            emitter.off(event, handler);
        }
    
    };

var Handler = function (value, data, myth) {
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
    };

Handler.prototype.execute = function (data, emitter, ev, that, args) {
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
};

module.exports = EvW;