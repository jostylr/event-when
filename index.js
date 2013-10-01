/*global setTimeout, process, module, console */
var EvW = function () {
        var evw = this;
    
        this._handlers = {};
        this._queue = [];
        this._waiting = [];
        this._actions = {};
    
        evw.resume = evw.resume.bind(evw);
        evw.next.max = 1000;
    
        return this; 
    };

EvW.prototype.on = function (ev, f, that, args, first) {
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

};
EvW.prototype.emit = function (ev, data,  timing, nolog) {
        var emitter = this;
    
        timing = timing || "soon";
        data = data || {};
        var h = this._handlers[ev] || [];
    
        if (!nolog) {
            emitter.log("emitting: " + ev, arguments);
        }
    
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
            emitter.log("handler for event removed" +  ev + " :: " + (fun.name || "") );
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
EvW.prototype.resume =  function () {
    
        var q, f, ev, data, cont, cur,  
            emitter = this,
            queue = emitter._queue,
            handlers = emitter._handlers,
            waiting = emitter._waiting; 
    
        // emitter.log("events on queue", queue.length+waiting.length, queue, waiting);
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
                cont = f.execute(data, emitter, ev);
            }
            this.next(this.resume);
        } else if (waiting.length > 0) {
            emitter.nextTick(function () {
                emitter.emit(ev, data, "now");
            });
        } else {
            emitter.log("emitted events cleared");
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
            return false;
        }
        
        var action = new Handler(handler, {that:that, args:args, name: name}); 
    
        if (emitter._actions.hasOwnProperty(name) ) {
            emitter.log("Overwriting action " + name);
        }
    
        emitter._actions[name] = action;
    
        return name;
    };
EvW.prototype.makeHandler = function (value, options) {
        return new Handler(value, options);
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
                    tracker.data._archive[str] = [];
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
            data[key] = eventData[key];
        }
    
        data._archive[event].push(eventData);
    
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

var Handler = function (value, options) {
        if (value instanceof Handler) {
            return value;
        }
    
        var handler = this,
            key;
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
            if (  (act = emitter.action(verb)) ) {
                emitter.log(ev + " --> " + verb);
                cont = act.execute(data, emitter, that, args, ev);
            } else if (emitter._handlers.hasOwnProperty(verb) ) {
                emitter.log(ev + " --emitting: " + verb );
                emitter.emit(verb, data, handler.timing, true);
            }
        } else if (vtype === "function") {
            cont = verb.call(that, data, emitter, args, ev);
        } else if (verb instanceof Handler) {
            cont = verb.execute(data, emitter, that, args, ev);
        } else if (Array.isArray(verb) ) {
            cont = verb[1].call(verb[0] || that, data, emitter, verb[2] || args, ev);
        }
        if (cont === false) {
            return cont;
        }
    }

    return cont;
};

module.exports = EvW;