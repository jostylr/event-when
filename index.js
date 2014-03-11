/*jshint eqnull:true*/
/*global setTimeout, process, module, console */

;(function () {
    var empty = {};

    var Handler = function (value, context) {
            if ( (value instanceof Handler) && 
                 (arguments.length === 1) ) {
                    return value;
            }
        
            var handler = this;
        
            handler.value = value; 
            handler.context = context;
        
            return handler;
        };

    Handler.prototype.execute = function me (data, evObj, context, value) {
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
                    emitter.log("executing action", value, evObj);
                    actions[value].execute(data, evObj, context);
                } else {
                    emitter.log("action not found", value, evObj);
                }
                return;
            }
    
            if (typeof value === "function") {
                emitter.log("executing function", value, evObj);
                value.call(context, data, evObj);
                return; 
            }
    
            if ( Array.isArray(value) ) {
                value.forEach(function (el) {
                    me.call(empty, data, evObj, context, el); 
                });
                return;
            }
    
            if ( typeof value.execute === "function" ) {
                value.execute(data, evObj, context);
                return;
            }   
    
            emitter.log("value not executable", value, evObj);
    
        } catch (e) {
            emitter.error(e, value, data, evObj, context);
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
                    return me.call(empty, val, el);
                });
            }
        
            if ( value && typeof value.contains === "function" ) {
                return value.contains(val);
            } 
        
            return false;
        
        };
    Handler.prototype.summarize = function me (value) {
            var ret, lead;
        
            if (typeof value === "undefined" ) {     
                value = this;
            }
        
           if (typeof value === "string") {
                return "a:" + value;
            }
        
            if (typeof value === "function") {
                return "f:" + (value.name || "");
            }
        
            if ( Array.isArray(value) ) {
                ret = value.map(function (el) {
                    return me.call(empty, el);
                });
                lead = value.name || "";
                return "arr: " + lead + " [" + ret.join(", ") + "]";
            }
        
            if ( value && typeof value.summarize === "function" ) {
                ret = me.call(empty, value.value);
                lead = value.name || "";
                return "h: "+ lead + " " + ret;
            } 
        
            return "unknown";
        
            };
    Handler.prototype.removal = function me (ev, emitter, value) {
            var actions = emitter._actions;
        
            if (typeof value === "undefined" ) {     
                value = this.value;
            }
        
            if ( ( value !== null) && (value.hasOwnProperty("tracker")) ) {
                value.tracker._removeStr(ev);
                return ;
            }
        
            if (typeof value === "string") {
                return actions[value].removal(ev, emitter);
            }
        
            if (typeof value === "function") {
                return; 
            }
        
            if ( Array.isArray(value) ) {
                value.forEach(function (el) {
                    return me.call({}, ev, emitter, el);
                });
            }
        
            if ( value && value.hasOwnProperty("value") ) {
                return me.call({}, ev, emitter, value.value); 
            } 
        
            return;
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
                events = tracker.events,
                emitter = tracker.emitter;
        
            if (Object.keys(events).length === 0) {
                if (tracker.reset === true) {
                    tracker.add(tracker.original);
                }
                emitter.emit(ev, data, tracker.timing); 
            }
            return tracker;
        };
    Tracker.prototype.cancel = function () {
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
            this._queue.name = "queue";
            this._waiting = [];
            this._waiting.name = "waiting";
            this._actions = {};
            this._scopes = {};
            this.scopeSep = ":";
            this._looping = false;
            this.loopMax = 1000;
            this.emitCount = 0;
            this.timing = "momentary";
        
            this.looper = this.looper.bind(this);
        
            return this; 
        };

    EvW.prototype.emit = function (ev, data, timing) {
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
            pieces : pieces,
            count : emitter.emitCount,
            timing : timing
        };
    
        var events = evObj.events = [];
    
        pieces.reduce(function (prev, el) {
            var ret = prev + (prev ? sep + el : el);            
            scopes[ret] = emitter.scope(ret);
            var h = emitter._handlers[ret];
            if (h) {
                //unshifting does the bubbling up
               events.unshift({scopeEvent: ret, handlers: h.slice()});
            }
            return ret;
        }, ""); 
    
        emitter.eventLoader(timing, evObj);
    
        emitter.log("emit", ev, data, timing, evObj);
    
        emitter.looper(ev);
    
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
    EvW.prototype.now = function (ev, data) {
            var emitter = this;
            emitter.emit(ev, data, "now");
            return emitter;
        };
    EvW.prototype.momentary = function (ev, data) {
            var emitter = this;
            emitter.emit(ev, data, "momentary");
            return emitter;
        };
    EvW.prototype.soon = function (ev, data) {
            var emitter = this;
            emitter.emit(ev, data, "soon");
            return emitter;
        };
    EvW.prototype.later = function (ev, data) {
            var emitter = this;
            emitter.emit(ev, data, "later");
            return emitter;
        };
    EvW.prototype.scope = function (ev, obj) {
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
                    return null;
                }
            }
            
            if ( obj == null ) {
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
        
            return ev;
        };
    
    EvW.prototype.on = function (ev, f, context) {
            var emitter = this,
                handlers = emitter._handlers;
        
            f = new Handler(f, context); 
        
            if (handlers.hasOwnProperty(ev)) {
                    handlers[ev].push(f);
            } else {
                handlers[ev] = [f];
                // contains is for searching the handler; it is a method
                handlers[ev].contains = Handler.prototype.contains;
            }
        
            emitter.log("on", ev, f, context); 
        
            return f;
        
        };
    EvW.prototype.off = function (events, fun, nowhen) {
        
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
                        return events.test();
                });
            }
        
            if ( typeof fun === "boolean") {
                nowhen = fun;
                fun = null;
            }
        
            if (fun) {
                events.forEach( function (ev) {
                    var removed = [];
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
                    h = handlers[ev];
                    while (h.length > 0) {
                        f = h.pop();
                        f.removal(ev, emitter);
                    }
                    delete handlers[ev];
                    emitter.log("removing all handlers on event", ev);
                }            
            });
            
            return emitter;
        };
    EvW.prototype.once = function (ev, f, n, context) {
            var emitter = this, 
                handler, g, temp;
        
            handler = new Handler([f], context);
        
            if ( (typeof n !== "number") && (typeof context === "number") ) {
                temp = n;
                n = context;
                context = temp;
            }
        
            handler.n = n || 1;
        
            g = function() {
                handler.n -=1;
                if (handler.n <= 0) {
                    emitter.off(ev, handler);
                }
            };
        
            handler.value.unshift(g);
        
            emitter.on(ev, handler); 
        
            emitter.log("once", ev, n, f, context, handler);
        
            return handler;
        };
    EvW.prototype.when = function (events, ev, timing, reset) {    
        
            var emitter = this;
        
            var tracker = new Tracker ();
        
            tracker.emitter = emitter;
            tracker.ev = ev;
            tracker.data = [];
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
            tracker.original = events.slice();
        
            var handler = new Handler (function (data, evObj) {
                var ev = evObj.cur[0];
                this.data.push([ev, data]);
                this.remove(ev);
            }, tracker);
        
            handler.tracker = tracker;
        
            tracker.handler = handler; 
        
            tracker.add(events);
        
            emitter.log("when", events, ev, timing, reset, tracker);
        
            return tracker;
        };
    
    EvW.prototype.looper = function (caller) {
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
                evObj = queue[0];
                events = evObj.events;
                
                if (events.length === 0) {
                    queue.shift();
                    continue;
                }
                
                cur = events[0]; 
                
                if (events[0].handlers.length === 0) {
                    events.shift();
                    continue;
                }
                
                ev = cur.scopeEvent;
                f = cur.handlers.shift();
                if (f) {
                    evObj.cur = [ev, f];
                    emitter.log("firing", ev, f, evObj);
                    f.execute(evObj.data, evObj);
                    emitter.log("fired", ev, f, evObj);
                    if ( evObj.stop === true ) {
                        emitter.log("emission stopped", ev, evObj);
                        ind = queue.indexOf(evObj);
                        if (ind !== -1) {
                            queue.splice(ind, 1);
                        }
                        continue;
                    }
                
                }
                loop += 1;
            }
        
            emitter._looping = false;
        
            if (queue.length) {
                emitter.log("looping hit max", loop);
                emitter.nextTick(self);
            } else if ( waiting.length ) {
                emitter.nextTick(self);
            }
        
            if (caller) {
                emitter.log("loop ended", caller, loop);
            }
        
            return emitter;
        
        };
    EvW.prototype.nextTick =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick 
            : (function (f) {setTimeout(f, 0);});
    EvW.prototype.stop = function (a) {
            var queue = this._queue,
                waiting = this._waiting,
                emitter = this,
                ev, tw, tq; 
        
            if (arguments.length === 0) {
                tw = queue.splice(0, queue.length);
                tq = waiting.splice(0, waiting.length);
                emitter.log("queue cleared of all events", tw, tq);
                return emitter; 
            }
        
            if (a === true) {
                ev = queue.shift();
                emitter.log("event cleared", ev);
                return emitter;
            }
            
            var filt, temp=[];
            
            if (typeof a = "string") {
                filt = function (el, ind, arr) {
                    if (el[0] === a) {
                        temp.push(arr.splice(ind, 1));
                    }
                };
            } else if ( Array.isArray(a) ) {
                filt = function (el, ind, arr) {
                    if (a.indexOf(el[0]) !== -1) {
                        temp.push(arr.splice(ind, 1));
                    }
                };
            } else if (a instanceof RegExp) {
                filt = function (el, ind, arr) {
                    if ( a.test(el[0]) ) {
                        temp.push(arr.splice(ind, 1));
                    }
                };
            } else if (typeof a === "function") {
                filt = function (el, ind, arr) {
                    if (a(el[0], el[1], arr)) {
                        temp.push(arr.splice(ind, 1));
                    }
                };
            } else {
                return emitter;
            }
            
            queue.forEach(filt);
            tq = temp.splice(0, temp.length);
            waiting.forEach(filt);
            tw = temp.splice(0, temp.length);
            emitter.log("some events stopped", a, tq, tw);
            return emitter;
        };
    
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
    EvW.prototype.action = function (name, handler, context) {
            var emitter = this;
        
            if (arguments.length === 0) {
                return Object.keys(emitter._actions);
            }
        
            if (arguments.length === 1) {
                return emitter._actions[name];
            }
        
            if ( (arguments.length === 2) && (handler === null) ) {
                delete emitter._actions[name];
                emitter.log("Removed action", name);
                return name;
            }
            
            var action = new Handler(handler, context); 
        
            if (emitter._actions.hasOwnProperty(name) ) {
                emitter.log("overwriting action", name, emitter._actions[name],
                    action);
            } else {
                emitter.log("creating action", name, action); 
            }
        
            emitter._actions[name] = action;
        
            return action;
        };
    EvW.prototype.makeHandler = function (value, context) {
            return new Handler(value, context);
        };
    EvW.prototype.error = function (e) {
            var emitter = this;
            emitter._looping = false;
            throw Error(e);
        };

    if (module) {
        module.exports = EvW;
    } else {
        this.EventWhen = EvW;
    }

} () );