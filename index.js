/*jshint eqnull:true*/
/*global setTimeout, process, module, console */

var Handler = function (value, data, myth) {
        if ( (value instanceof Handler) && 
             (arguments.length === 1) ) {
                return value;
        }
    
        var handler = this;
    
        handler.value = value; 
        handler.data = data;
        handler.myth = myth;
    
        return handler;
    };

Handler.prototype.traverse = function me (com, args, value) {
    if ( value == null ) {
        if ( this.hasOwnProperty("value") ) {
            value = this.value;
        } else {
            value = {};
        }
    }

    var ret;

    if (typeof value === "string") {
        if (typeof com.string === "function") {
            return com.action(com, args, value);
        }
    }
        
    if (typeof value === "function") {
        if (typeof com.arg === "function") {
            return com.fun(com, args, value);
        }
    }
        
    if ( Array.isArray(value) ) {
        ret = value.map(function (el) {
            return me.call(null, com, args, el); 
        });
        if (typeof com.array === "function") {
            return com.array(com, args, ret, value);
        } else {
            return ret;
        }
    }

    if ( typeof value.traverse === "function" ) {
        ret = value.traverse(com, args, value);
        if (typeof com.handler === "function") {
            return com.handler(ret);
        } else {
            return ret;
        }
    }   

    if (typeof com.error === "function") {
        com.error(com, args, value); 
    } else {
        return ; 
    }

}; 
Handler.prototype.execute = function me (data, passin, value) {
        if (passin.stop) {
            return;
        }
    
        var handler = this,
            emitter = passin.emitter,                
            actions = emitter._actions;
    
        value = value || handler.value;
    
        try {
            if (typeof value === "string") {
                if ( actions.hasOwnProperty(value) ) {
                    emitter.log("executing action", value, passin);
                    actions[value].execute(data, passin);
                } else {
                    emitter.log("action not found", value, passin);
                }
                return;
            }
    
            if (typeof value === "function") {
                emitter.log("executing function", value, passin);
                value.call(passin, data);
                return; 
            }
    
            if ( Array.isArray(value) ) {
                value.forEach(function (el) {
                    me(data, passin, el); 
                });
                return;
            }
    
            if ( typeof value.execute === "function" ) {
                value.execute(data, passin);
                return;
            }   
    
            emitter.log("value not executable", value, passin);
    
        } catch (e) {
            emitter.error(e, value, data, passin);
        }
    
        return;
    }; 
Handler.prototype.contains = function me (val, value) {
        if (this === val) {
            return true;
        }
        
        value = value || this.value;
    
        if (value === val) {
            return true;
        } 
    
        if ( Array.isArray(value) ) {
            return value.some(function (el) {
                return me(val, el);
            });
        }
    
        if ( value && typeof value.contains === "function" ) {
            return value.contains(val);
        } 
    
        return false;
    
    };

var Tracker = function () {
        this.events = {};
        return this;
    };

Tracker.prototype.add = function (newEvents) {
    var tracker = this,
        events = tracker.events,
        handler = tracker.handler;

    if (arguments.length !== 1) {
        newEvents = Array.prototype.slice.call(arguments);
    } else if (! Array.isArray(newEvents) ) {
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
};
Tracker.prototype.remove = function (byeEvents) {
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
    };
Tracker.prototype._removeStr = function (ev) {
        var tracker = this;
    
        delete tracker.events[ev];
    
        tracker.go();
        return tracker;
    };
Tracker.prototype.go = function () {
        var tracker = this, 
            ev = tracker.ev, 
            data = tracker.data,
            myth = tracker.mayth,
            events = tracker.events,
            emitter = tracker.emitter;
    
        if (Object.keys(events).length === 0) {
            if (tracker.reset === true) {
                tracker.add(tracker.original);
            }
            emitter.emit(ev, data, myth, tracker.timing); 
        }
        return tracker;
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
        return tracker;
    };
Tracker.prototype.reinitialize = function () {
        var tracker = this;
    
        tracker.cancel();
        tracker.add(tracker.original);
        tracker.go();
        return tracker;
    };

var EvW = function () {
    
        this._handlers = {};
        this._queue = [];
        this._waiting = [];
        this._actions = {};
        this._scopes = {};
        this.scopeSep = ":";
        this.looping = false;
        this.loopMax = 1000;
        this.emitCount = 0;
        this.timing = "momentary";
    
        this.looper = this.looper.bind(this);
    
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
        handlers[ev].contains = f.contains;
    }

    return f;

};
EvW.prototype.emit = function (ev, data, myth, timing) {
        var emitter = this, 
            sep = emitter.scopeSep;
    
        timing = timing ||emitter.timing || "momentary";
    
        emitter.log("emit", ev, data, myth, timing);
    
        var pieces = ev.split(sep);
    
        emitter.emitCount += 1;
    
        var scopeData = {}, 
            scopeMyth = {}; 
    
        var lev = "";
        scopes = pieces.map(function (el) {
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
            pieces : pieces,
            scopeData : scopeData,
            scopeMyth : scopeMyth,
            count : emitter.emitCount,
            timing : timing
        };
    
        var events = evObj.events = [];
    
        scopes.forEach(function (el) {
           var h = emitter._handlers[el];
           if (h) {
                //unshifting does the bubbling up
               events.unshift({scopeEvent: el, handlers: h.slice()});
           }
        }); 
    
        emitter.eventLoader(timing, evObj);
    
        emitter.looper();
    
        return emitter;
    };
EvW.prototype.eventLoader = function (timing, evObj) {
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
EvW.prototype.off = function (events, fun, nowhen) {
    
        var emitter = this;
    
        var handlers = emitter._handlers;
        var h, f;
    
        if ( (events == null) && (fun == null) ) {
            emitter._handlers = {};
            emitter.log("all handlers removed");
            return emitter;
        }
    
        if (events == null) {
            events = Object.keys(emitter._handlers);
        } else if (typeof events === "string") {
            events = [events];
        }
    
        if ( typeof fun === "boolean") {
            nowhen = fun;
            fun = null;
        }
    
        if (fun) {
            events.forEach( function (ev) {
                handlers[ev] = handlers[ev].filter(function (handler) {
                    return ! handler.contains(fun);
                }); 
                if ( (nowhen !== true) && fun.hasOwnProperty("tracker") )  {
                    fun.tracker._removeStr(ev);
                }
                emitter.log("handler for event removed", ev, fun );
            });
            return emitter;    
        } 
    
        events.forEach( function (ev) {
            if (nowhen === true) {
                delete handlers[ev];
                emitter.log("removed handlers on event, leaving on when", ev); 
                return emitter;
            } else {
                h = handlers[ev];
                while (h.length > 0) {
                    f = h.pop();
                    if (f.hasOwnProperty("tracker") ) {
                        f.tracker._removeStr(ev);
                    }
                }
                delete handlers[ev];
                emitter.log("removing handles on event", ev);
            }            
    
        });
        
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
EvW.prototype.looper = function () {
        var emitter = this,
            queue = emitter._queue,
            waiting = emitter._waiting,
            loopMax = emitter.loopMax,
            self = emitter.looper,
            loop = 0, 
            f, ev, passin, evObj, events, cur, ind;
    
        if (emitter.looping) {
            emitter.log("looping called again");
            return;
        }
    
        if ( (queue.length === 0) && (waiting.length > 0) ) {
            queue.push(waiting.shift());
        }
    
        emitter.looping = true;
    
        while ( (queue.length) && (loop < loopMax ) ) {
            evObj = queue[0];
            events = evObj.events;
            
            if (events.length === 0) {
                queue.shift();
                continue;
            }
            
            passin = {};
            cur = events[0]; 
            
            if (events[0].handlers.length === 0) {
                events.shift();
                continue;
            }
            
            ev = cur.scopeEvent;
            f = cur.handlers.shift();
            if (f) {
                passin = {
                        emitter : emitter,
                        scope : ev,
                        data : {
                            emit : evObj.emitData,
                            event : evObj.scopeData[ev],
                            events : evObj.scopeData,
                            handler : f.data
                        },
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
                emitter.log("firing", passin);
                f.execute(evObj.emitData, passin);
                emitter.log("fired", passin);
                if ( passin.stop === true ) {
                    emitter.log("emission stopped", passin);
                    ind = queue.indexOf(evObj);
                    if (ind !== -1) {
                        queue.splice(ind, 1);
                    }
                    continue;
                }
            
            }
            loop += 1;
        }
    
        emitter.looping = false;
    
        if (queue.length) {
            emitter.log("looping hit max", loop);
            emitter.nextTick(self);
        } else if ( waiting.length ) {
            emitter.nextTick(self);
        }
    
        return emitter;
    
    };
EvW.prototype.when = function (events, ev, timing, reset) {    
    
        var emitter = this;
    
        emitter.log(".when loaded", events, ev, timing, reset);
    
        var tracker = new Tracker ();
    
        tracker.emitter = emitter;
        tracker.ev = ev;
        tracker.data = [];
        tracker.myth = [];
        tracker.timing = timing || emitter.timing || "now";
        tracker.reset = reset || false;
        tracker.original = events.slice();
    
        var handler = new Handler (function (data) {
            var passin = this;
            var ev = passin.scope;
            tracker.data.push([ev, data]);
            tracker.myth.push([ev, passin.myth.emit]);
            tracker.remove(ev);
        });
    
        handler.tracker = tracker;
    
        tracker.handler = handler; 
    
        tracker.add(events);
    
        return tracker;
    };
EvW.prototype.once = function (ev, f, n, data, myth) {
        var emitter = this, 
            handler, g;
    
        handler = new Handler([f], data, myth);
    
        handler.n = n || 1;
    
        g = function() {
            handler.n -=1;
            if (handler.n <= 0) {
                emitter.off(ev, handler);
            }
        };
    
        handler.value.unshift(g);
    
        emitter.on(ev, handler); 
    
        emitter.log("assigned event times", ev, n, f, data, myth, handler);
    
        return handler;
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
EvW.prototype.action = function (name, handler, data, passin) {
        var emitter = this;
    
        if (arguments.length === 1) {
            return emitter._actions[name];
        }
    
        if ( (arguments.length === 2) && (handler === null) ) {
            delete emitter._actions[name];
            emitter.log("Removed action " + name);
            return name;
        }
        
        var action = new Handler(handler, data, passin); 
    
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
            delete emitter._scopes[ev];
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
EvW.prototype.error = function (e) {
        var emitter = this;
        emitter.looping = false;
        throw Error(e);
    };

module.exports = EvW;