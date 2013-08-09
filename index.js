/*global setTimeout, process, module */
var EvW = function () {
        var evw = this;
    
        this._handlers = {};
        this._queue = [];
        this._waiting = [];
    
        evw.resume = evw.resume.bind(evw);
        evw.next.max = 1000;
    
        return this; 
    };

EvW.prototype.on = function (ev, f, first) {
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
};
EvW.prototype.emit = function (ev, data,  timing) {
        var emitter = this;
    
        timing = timing || "soon";
        data = data || {};
        var h = this._handlers[ev] || [];
    
        emitter.log("emit", ev, data, timing);
    
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
    
        var handlers = this._handlers;
        var h, f;
    
        if (arguments.length === 0) {
            this._handlers = {};
            return this;
        }
    
        if (typeof fun === "function") {
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
            return this;
        }
    
        if (typeof fun === "boolean") {
            nowhen = fun;
        }
    
        if (nowhen === true) {
            delete handlers[ev];
            return this;
        } else {
            h = handlers[ev];
            while (h.length > 0) {
                f = h.pop();
                if (fun.hasOwnProperty("tracker") ) {
                    fun.tracker.removeStr(ev);
                }
            }
            delete handlers[ev];
        }            
        
        return this;
    };
EvW.prototype.stop = function (a) {
        var queue = this._queue;
        var waiting = this._waiting; 
    
        if (arguments.length === 0) {
            while (queue.length > 0 ) {
                queue.pop();
            }
            while (waiting.length >0 ) {
                waiting.pop();
            }
        }
    
        var filt = function (el) {
            if (el[0] === a) {
                return false;
            } else {
                return true;
            }
        };
    
        if (typeof a === "string") {
            this._queue = queue.filter(filt);
            this._waiting = waiting.filter(filt);
        }
    
        if (a === true) {
            queue.shift();
        }
    
        return this;
    };
EvW.prototype.resume = function () {
    
        var q, f, ev, data, cont, cur,
            emitter = this,
            queue = emitter._queue,
            handlers = emitter._handlers,
            waiting = emitter._waiting; 
    
        emitter.log("resume", queue, waiting);
    
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
                emitter.log(f.log, ev, data);
                cont = f(data, ev);
                if ( (cont === false) && (cur === queue[0]) ) {
                    queue.shift(); 
                }
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
EvW.prototype.emitWhen = function (ev, events, immediate, reset) {    
    
        var emitter = this, 
            options;    
    
        emitter.log("emit when", ev, events, immediate);
    
        if (typeof immediate === "object") {
            options = immediate;
            reset = options.reset || false;
            immediate = options.immediate || false;
        }
    
        var tracker = new Tracker();
    
        tracker.event = ev;
        tracker.emitter = emitter;
        tracker.immediate = immediate;
        tracker.reset = reset;
        tracker.original = events;
    
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
    };
EvW.prototype.once = function (ev, f, n, first) {
        var emitter = this, 
            g;
    
        // allow shortened list
        if (arguments.length === 3 && n === true) { 
            n = 1;
            first = true; 
        }
    
        if (!n) {
            n = 1;
        }
    
        g = function () {
            n -= 1; 
            if ( n < 1) {
                emitter.off(ev, g);
            }
            return f.apply(null, arguments); 
        };
    
        emitter.on(ev, g, first); 
    
        return this;
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
        tracker.go();
    };
Tracker.prototype.removeStr = function (ev) {
        var tracker = this;
    
        delete tracker.events[ev];
    
        tracker.go();
    };
Tracker.prototype.go = function () {
        var tracker = this, 
            ev = tracker.event, 
            data = tracker.data,
            events = tracker.events,
            immediate = tracker.immediate;
    
        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
                    if (typeof ev === "string") {
                        tracker.emitter.emit(ev, data, immediate);
                    } else if (typeof ev === "function") {
                        ev(data, "emitWhen handler called");
                    } else if (Array.isArray(ev) ) {
                ev.forEach(function (ev) {
                            if (typeof ev === "string") {
                                tracker.emitter.emit(ev, data, immediate);
                            } else if (typeof ev === "function") {
                                ev(data, "emitWhen handler called");
                            }
                });
            }
        }
    
        return true;
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

module.exports = EvW;