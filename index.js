/*global setTimeout, process, module */
var EvW = function () {
        var evw = this;
    
        this._handlers = {};
        this._queue = [];
    
        evw.resume = evw.resume.bind(evw);
    
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
EvW.prototype.emit = function (ev, data,  immediate) {
    
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
    };
EvW.prototype.resume =  function () {
    
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
    };
EvW.prototype.emitWhen = function (ev, events, immediate, reset) {    
    
        var emitter = this, 
            options;    
    
        if (emitter.log) {
            emitter.log("emit when", ev, events, immediate);
        }
    
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

EvW.prototype.next =  function(f) {f();};
/*(typeof process !== "undefined" && process.nextTick) ? process.nextTick : (function (f) {setTimeout(f, 0);});
*/

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
                console.log(tracker.events);
            }
            console.log(ev, immediate);
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