/*jshint eqnull:true*/
/*global setTimeout, process, module, console */

;(function () {
    var empty = {};

    var filter = function (condition, negate) {
            
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
        
                return function () {};
                
            }
        
        };

    var Handler = function (value, context) {
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
    Handler.prototype.contains = function me (target, htype) {
        
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
    Handler.prototype.removal = function me (ev, emitter, htype) {
            var actions = emitter._actions;
            
            htype = htype || this;
        
            if ( htype.hasOwnProperty("tracker") ) {
                htype.tracker._removeStr(ev);
                emitter.log("untracked", ev, htype.tracker, htype);
                return ;
            }
        
            if (typeof htype === "string") {
                actions[htype].removal(ev, emitter);
                return;
            }
        
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
            this._monitor = [];
            this.scopeSep = ":";
            this._looping = false;
            this.loopMax = 1000;
            this.emitCount = 0;
            this.timing = "momentary";
        
            this.looper = this.looper.bind(this);
        
            return this; 
        };

    EvW.prototype._emit = EvW.prototype.emit = function (ev, data, timing) {
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
    EvW.prototype._emitWrap = function (ev, data, timing) {
            var emitter = this, 
                mon = emitter._monitor,
                go = true;
           
            mon.forEach(function (el) {
                var filt = el[0],
                    fun = el[1], 
                    temp;
        
                if (filt(ev)) {
                    temp = fun(ev, data, emitter); 
                    if (temp === "stop") {
                        go = false;
                    }
                }
            });
        
            if (go) {
                emitter._emit(ev, data, timing);
            }
        
            return emitter;
        
        };
    EvW.prototype.monitor = function (filt, listener) {
        
            var emitter = this,
                mon = emitter._monitor, 
                temp, ret;
        
            if (arguments.length === 0) {
                return mon;
            }
        
            if (arguments.length === 1) {
                temp = mon.indexOf(filt);
                if (temp !== -1) {
                    mon.splice(temp, 1);
                }
        
                if (mon.length === 0) {
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
                emitter.emit = emitter._emitWrap;
                return ret;
            }
        
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
        };
    EvW.prototype.scopes = function (evfilt, neg) {
        
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
    EvW.prototype.stop = function (a, neg) {
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
                filt;
        
                
            var wrap = function (f) {
                    return function () {
                        return ! (f.apply(this, Array.prototype.slice.call(arguments)));
                    };
                };
        
            if (typeof partial === "function") {
                filt = (negate ? wrap(partial) : partial);
                return keys.filter( filt );
            } else if (partial instanceof RegExp) {
                filt = (function (el) {
                    if (partial.test(el)) {
                        return true;
                    } else {
                        return false;
                    }
                }); 
                filt = (negate ? wrap(filt) : filt);
                return keys.filter( filt );
            } else if (typeof partial === "string") {
                filt = (function (el) {
                    if (el.indexOf(partial) !== -1) {
                        return true;
                    } else {
                        return false;
                    }
                }); 
                filt = (negate ? wrap(filt) : filt);
                return keys.filter( filt );
            } else if (Array.isArray(partial)) {
                filt = (function (el) {
                    if (partial.indexOf(el) !== -1 ) {
                        return true;
                    } else {
                        return false;
                    }
                });
                filt = (negate ? wrap(filt) : filt);
                return keys.filter( filt );
            } else {
                return keys;
            }
        
        };
    EvW.prototype.handlers = function (events, empty) {
            var emitter = this, 
                handlers = emitter._handlers, 
                ret = {}; 
        
            if (!Array.isArray(events)) {
                events = this.events(events);
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
    EvW.prototype.actions = function (evfilt, neg) {
        
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
        };
    EvW.prototype.makeHandler = function (value, context) {
            return new Handler(value, context);
        };
    EvW.prototype.error = function (e, handler, data, evObj, context) {
            var emitter = this;
            emitter._looping = false;
            emitter.log("error raised", e, handler, data, evObj, context);
            throw Error(e);
        };

    if (module) {
        module.exports = EvW;
    } else {
        this.EventWhen = EvW;
    }

} () );