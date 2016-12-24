/*jshint eqnull:true*/
/*global setTimeout, process, module, console */

;(function () {
    var empty = {};

    var noop = function () {};

    var filter = function (condition, negate) {
            
            if ( (Array.isArray(condition)) && (typeof condition[1] === "boolean") ) {
                negate = condition[1];
                condition = condition[0];
            }
        
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
        
                return function () {return true;};
                
            }
        
        };

    var decycle = function (obj) {
        
            var objects = [],   // Keep a reference to each unique object or array
                paths = [],     // Keep the path to each unique object or array
                ret;
        
            ret = (function derez(value, path) {
                
                    var i, name, nu, temp, ret;
                 
                    if (typeof value === "function") {
                        if (value.hasOwnProperty("name")) {
                            ret = value.name;
                        } else {
                            ret = value.toString();
                            temp = ret.indexOf("(");
                            ret = ret.slice(9, temp).trim() || "";
                        }
                        return "`" + ret + "`";
                    }
                
                    if ( typeof value === 'object' && value !== null &&
                        !(value instanceof Boolean) &&
                        !(value instanceof Date)    &&
                        !(value instanceof Number)  &&
                        !(value instanceof RegExp)  &&
                        !(value instanceof String) ) {
                            
                            if ( value.hasOwnProperty("_label") ) {
                                if ( value.hasOwnProperty("_type") ) {
                                    temp = {};
                                    temp["$"+value._type] = value._label;
                                    return temp;
                                } else if ( Array.isArray(value) ) {
                                    return {$arr:value._label};
                                } else {
                                    return {$obj:value._label};
                                }
                            }
                            
                            if ( ( i = objects.indexOf(value) ) !== -1 ) {
                                return {$ref: paths[i]};
                            }
                            
                            objects.push(value);
                            paths.push(path);
                            
                            if ( Array.isArray(value) ) {
                                return value.map(function (el, ind) {
                                    return derez(el, path + "[" + ind + "]");
                                });
                            }
                            
                            nu = {};
                            for ( name in value ) {
                                if ( value.hasOwnProperty(name) ) {
                                    nu[name] = derez(value[name],
                                        path + '[' + name + ']');
                                }
                            }
                            return nu;
                
                    }
                
                    return value;
                })(obj, "$");
            return ret;
        };

    var serial = function (obj) {
        
            var ret;
            
            if (arguments.length > 1) {
                obj = Array.prototype.slice.call(arguments, 0);
            }
        
            ret =  JSON.stringify(decycle(obj)) || "";
        
            return ret.replace(/\"\`|\`\"/g, "`");
        
        };

    var Handler = function (value, context) {
            if (value instanceof Handler) { 
                 if (typeof context === "undefined") {
                    return value;
                 } else {
                    this.value = value.value;
                    if (value.hasOwnProperty("_label")) {
                        this._label = value._label;
                    }
                    this.context = context;
                    return this;
                 }
            }
        
            var handler = this;
        
            handler.value = value;
            if (value.hasOwnProperty("_label")) {
                        handler._label = value._label;
                    }
        
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
                    emitter.log("executing action", value, context, evObj);
                    return actions[value].execute(data, evObj, context);
                } else {
                    emitter.log("action not found", value, evObj);
                    return false;
                }
            }
    
            if (typeof value === "function") {
                emitter.log("executing function", value, context, 
                    evObj);
                return value.call(context, data, evObj);
            }
    
            if ( Array.isArray(value) ) {
                return value.some(function (el) {
                    return me.call(empty, data, evObj, context, el); 
                });
            }
    
            if ( typeof value.execute === "function" ) {
                return value.execute(data, evObj, context);
            }   
    
            emitter.log("value not executable", value, evObj);
    
        } catch (e) {
            emitter.error(e, value, data, evObj, context);
        }
    
        return false;
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
                return serial(value);
            }
        
            if ( Array.isArray(value) ) {
                ret = value.map(function (el) {
                    return me.call(empty, el);
                });
                lead = value._label || "";
                return lead + "[" + ret.join(", ") + "]";
            }
        
            if ( value && typeof value.summarize === "function" ) {
                ret = me.call(empty, value.value);
                lead = value._label || "";
                return "h:" + lead + " " + ret;
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
                if (actions.hasOwnProperty(htype) ) {
                    actions[htype].removal(ev, emitter);
                }
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
            this.silent = [];
            return this;
        };

    Tracker.prototype.add = function (newEvents) {
        var tracker = this,
            events = tracker.events,
            handler = tracker.handler,
            data = tracker.data, 
            i;
    
        if (arguments.length !== 1) {
            newEvents = Array.prototype.slice.call(arguments);
        } else if (! Array.isArray(newEvents) ) {
            newEvents = [newEvents];
        } else if (typeof newEvents[1] === "number") {
            newEvents = [newEvents];
        }
    
        newEvents.forEach(function (el) {
            var num, str, order;
            if (typeof el === "string") {
                str = el;
                num = 1;
            }
            if (Array.isArray(el) ) {
                if ((typeof el[1] === "number") && (el[1] >= 1) && 
                    (typeof el[0] === "string") ) {
                    
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
                if (tracker.initialOrdering) {
                    for ( i = 0; i<num; i+=1 ) {
                        data.push([str]);
                    }
                }
                tracker.latest = str;
            }
        });
        tracker.go();
        return tracker;
    };
    Tracker.prototype.remove = Tracker.prototype.rem = function (byeEvents) {
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
                emitter = tracker.emitter,
                silent = tracker.silent;
        
            if (Object.keys(events).length === 0) {
                data = data.filter(function (el) {
                    return silent.indexOf(el[0]) === -1;  
                });
                if (tracker.flatten) {
                    if (data.length === 1) {
                        data = data[0][1];
                    } else {
                        data = data.map(function (el) {return el[1];});
                    }
                }
                // this is to do the falt thing, but always return array
                if (tracker.flatArr) {
                    data = data.map(function (el) {return el[1];});
                }
                
                if (tracker.reset === true) {
                    tracker.reinitialize();
                } else if (tracker.idempotent === false) {
                    if (tracker === emitter.whens[ev]) {
                        delete emitter.whens[ev];
                    }
                    tracker.go = noop;
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
            var ev = tracker.ev;
            var emitter = tracker.emitter;
        
            tracker.cancel();
            tracker.add(tracker.original);
            if (tracker.go === noop) {
                delete tracker.go; //restores to prototype
                if (tracker.mutable) {
                    if (emitter.whens[ev]) {
                        emitter.log("reinitializing .when; making immutable due to conflict", tracker);
                        tracker.mutable = false;
                    } else {
                        emitter.whens[ev] = tracker;
                    }
                }
            }
            tracker.go();
            return tracker;
        };
    Tracker.prototype.silence = function () {
            var tracker = this;
            if (arguments.length === 0) {
                tracker.silent.push(tracker.latest);
            } else {
                Array.prototype.push.apply(tracker.silent, arguments); 
            }
            return tracker;
        };

    var EvW = function () {
        
            this._handlers = {};
            this._onces = {};
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
            this.whens = {};
            this._cache = {};
            this.initialOrdering = false;  // for .when tracker behavior
        
            this.looper = this.looper.bind(this);
        
            this._label = "emitter";
        
            return this; 
        };

    EvW.prototype._emit = EvW.prototype.emit = function (ev, data, timing) {
        var emitter = this, 
            sep = emitter.scopeSep, 
            scopes = {};
    
        timing = timing ||emitter.timing || "momentary";
        
        if (typeof ev !== "string") {
            // not going to use internal error since this needs to end
           console.error("emit called with no event", ev, data, timing);
           return;
        }
    
        var pieces = ev.split(sep);
    
        emitter.emitCount += 1;
    
        var evObj = {
            emitter: emitter,
            ev : ev,
            data : data,
            scopes : scopes, 
            count : emitter.emitCount,
            timing : timing,
            unseen : true
        };
    
        var events = evObj.events = [];
    
        pieces.reduce(function (prev, el) {
            var ret = prev + (prev ? sep + el : el);            
            scopes[ret] = emitter.scope(ret);
            scopes[el] = emitter.scope(el);
            var h = emitter._handlers[ret];
            if (h) {
                //unshifting does the bubbling up
               events.unshift([ret, h.slice()]);
            }
            return ret;
        }, ""); 
    
        evObj.pieces = pieces.reverse();
    
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
                    emitter.log("intercepting event", ev, data, el);
                    temp = fun(ev, data, emitter); 
                    if (temp === "stop") {
                        emitter.log("stopping event", ev, data, el);
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
                    emitter.log("removing wrapper", filt);
                    mon.splice(temp, 1);
                } else {
                    emitter.log("attempted removal of wrapper failed", filt);
                }
        
                if (mon.length === 0) {
                    emitter.log("restoring normal emit", filt.filt, filt); 
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
                ret.filt = filt;
                emitter.log("wrapping emit", filt, listener, ret);
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
    
    EvW.prototype.on = function (ev, proto, context) {
            var emitter = this,
                handlers = emitter._handlers;
        
            var f = new Handler(proto, context); 
        
            if (handlers.hasOwnProperty(ev)) {
                    handlers[ev].push(f);
            } else {
                handlers[ev] = [f];
                // contains is for searching the handler; it is a method
                handlers[ev].contains = Handler.prototype.contains;
            }
        
            emitter.log("on", ev, proto, context); 
        
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
                    if (handlers.hasOwnProperty(ev) ) {
                        handlers[ev] = handlers[ev].filter(function (handler) {
                            if (handler.contains(fun) ) {
                                removed.push(handler);
                                return false;
                            } else {
                                return true;
                            }
                        });
                        if (handlers[ev].length === 0) {
                            delete handlers[ev];
                        }
                    }
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
                handler, g, h, temp;
        
            handler = new Handler([f], context);
        
            handler._label = "(once)" + (f._label || f.name ||'');
        
            if ( (typeof n !== "number") && (typeof context === "number") ) {
                temp = n;
                n = context;
                context = temp;
            }
        
            if (typeof n === "undefined") {
                handler.n = n = 1;
            } else {
                handler.n = n;
            }
        
            if (f._label) { 
                emitter._onces[f._label] = [ev, n, n];
                g = function() {
                    if (handler.n >= 1) {
                        handler.n -=1;
                    } else { //should rarely happen
                        emitter.off(ev, handler);
                        delete emitter._onces[f._label];
                        return true; // prevents f from being executed
                    }
                };
        
                h = function () {
                    if (handler.n === 0) {
                        emitter.off(ev, handler);
                        delete emitter._onces[f._label];
                    } else {
                        emitter._onces[f._label][2] -= 1;
                    }
                };
        
            } else {
                g = function() {
                    if (handler.n >= 1) {
                        handler.n -=1;
                        if (handler.n === 0) {
                            handler.value.push(function () {
                                emitter.off(ev, handler);
                            });
                        } 
                    } else {
                        emitter.off(ev, handler);
                        return true;
                    }
                };
               
               h = function () {
                    if (handler.n === 0) {
                        emitter.off(ev, handler);
                    }
                };
        
            }
        
            handler.value.unshift(g);
            handler.value.push(h);
        
            emitter.on(ev, handler); 
        
            emitter.log("once", ev, n, f, context);
        
            return handler;
        };
    EvW.prototype.when = function (events, ev, timing, reset, immutable, initialOrdering) {    
        
            var emitter = this;
            var tracker; 
        
            if (!immutable) {
                tracker = emitter.whens[ev]; 
                if (tracker) {
                    emitter.log("when add", events, ev);
                    tracker.add(events);
                    return tracker;
                }
            }
        
            if (typeof initialOrdering === "undefined") {
               initialOrdering = emitter.initialOrdering;  
            }
        
            tracker = new Tracker ();
        
            tracker.emitter = emitter;
            tracker.ev = tracker._label = ev;
            tracker.data = [];
            tracker.silent = [];
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
            tracker.idempotent = false;
            tracker.initialOrdering = initialOrdering;
        
            var handler = new Handler (function (data, evObj) {
                var ev = evObj.cur[0]; // subevent
                var fullev = evObj.ev; // full event that triggered
                var tracker = this;
                var results = tracker.data;
                var i, n;
                if (tracker.initialOrdering) {
                    n = results.length;
                    if (typeof data === "undefined") {
                        data = null;
                    }
                    for (i =0; i < n; i+=1) {
                        if ( (results[i].length === 1) && (results[i][0] === ev) ) {
                            results[i][1] = data;
                            if (fullev !== ev) {
                                results[i][2] = fullev;
                            }
                            break;
                        }
                    }
                } else {
                    if (typeof data !== "undefined") {
                        if (fullev !== ev) {
                            tracker.data.push([ev, data, fullev]);
                        } else {
                            tracker.data.push([ev, data]);
                        }
                    }
                }
                tracker.remove(ev);
            }, tracker);
        
            handler.tracker = tracker;
        
            handler._label = "(when)" + ev;
        
            tracker.handler = handler; 
        
            tracker.add(events);
        
            if (!immutable) {
                emitter.whens[ev] = tracker;
                tracker.mutable = true;
            } else {
                tracker.mutable = false;
            }
            
            emitter.log("when", events, ev, timing, reset, tracker);
        
            return tracker;
        };
    EvW.prototype.flatWhen = function () {
           var tracker = this.when.apply(this, arguments); 
           tracker.flatten = true;
           return tracker;
        };
    EvW.prototype.flatArrWhen = function () {
           var tracker = this.when.apply(this, arguments); 
           tracker.flatArr = true;
           return tracker;
        };
    EvW.prototype.cache = function (req, ret, fun, emit) {
            
            var gcd = this;
            var cache = gcd._cache;
            var start, end, data, timing, cached;
        
            if (typeof req === "string") {
                start = req;
                data = null;
                timing = timing ||gcd.timing || "momentary";
            } else if (Array.isArray(req))  {
                start = req[0];
                data = req[1];
                timing = req[3] ||gcd.timing || "momentary"; 
            } else {
                gcd.log("bad cache request", req);
                return;
            }
        
            if (typeof ret !== "string") {
                gcd.log("bad cache return signal", ret);
                return;
            }
            
            if (typeof fun === "string") {
                emit = fun;
                fun = null; 
            }
        
            
            if (cache.hasOwnProperty(start) ) {
                cached = cache[start];
                if (cached.hasOwnProperty("done")) {
                    end = cached.done;
                    if (fun) {
                        end = fun(end);
                    } 
                    if (emit) {
                        gcd.emit(emit, end, timing);    
                    }
                                
                } else {
                    cached.waiting.push([fun, emit]);
                }
            } else {
                cache[start] = cached = { waiting : [[fun, emit]]};
                gcd.on(ret, function (original) {
                        var i, n, waiting, proc, end;
                    
                        cached.done = original;
                        waiting = cached.waiting;
                        
                        n = waiting.length;
                        for (i = 0; i < n; i +=1) {
                           end = original;
                           proc = waiting.shift();
                           fun = proc[0];
                           emit = proc[1];
                           if (fun) {
                               end = fun(end);
                           } 
                           if (emit) {
                               gcd.emit(emit, end, timing);    
                           }
                                       
                        }
                    });
                gcd.emit(start, data, timing);
            }
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
                
                if (evObj.unseen) {
                    emitter.log("seeing new event", evObj.ev, evObj);
                    delete evObj.unseen;
                    delete evObj.again;
                } else if (evObj.again) {
                    emitter.log("seeing event again", evObj.ev, evObj);
                    delete evObj.again; 
                }
                
                
                if (events.length === 0) {
                    queue.shift();
                    continue;
                }
                
                cur = events[0]; 
                
                if (events[0][1].length === 0) {
                    events.shift();
                    continue;
                }
                
                ev = cur[0];
                f = cur[1].shift();
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
                queue[0].again = true;
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
    EvW.prototype.makeLog = function (len) {
        
            var emitter = this;
            
            var s;
            switch (typeof len) {
                case "number" : 
                    s = function () {
                        var str =  emitter.serial.apply({}, 
                            Array.prototype.slice.call(arguments, 0) );
            
                        var ret = str.slice(0,len);
            
                        return ret;
                    };
                break;
                case "function" : 
                    s = len;
                break;
                default :
                    s = emitter.serial;
            }
            var se = emitter.serial;
        
            var logs = [],
                full = [], 
                fdesc = {"emit" : function (ev, data, timing, evObj) {
                        return evObj.count + ". EMITTING " + se(ev)  + 
                            ( (typeof data !== "undefined") ? 
                                " DATA " + s(data) :
                                "" ) +
                            ( (timing !== emitter.timing) ? " TIMING " + 
                                se(timing) : "" );
                    },
                      
                    "restoring normal emit" : function () {
                        return "Last monitor removed, emit restored";
                    },
                    
                    "wrapping emit" : function (filt, listener) {
                        return "ADD MONITOR " + s(filt, listener);
                    },
                    
                    
                    "removing wrapper" : function (filt) {
                        return "SUB MONITOR " + s(filt.filt, filt[1]);
                    },
                    
                    "attempted removal of wrapper failed": function(filt){
                        return "NO SUCH MONITORY " + s(filt);
                    },
                    
                    "intercepting event" : function ( ev, data, filt){
                        return "INTERCEPTING " + se(ev) +
                               ( (typeof data !== "undefined") ? 
                                " DATA " + s(data) :
                                "" ) +
                            " MONITOR " + s(filt.filt, filt[1]);
                    },
                    
                    "stopping event" : function(ev, data, filt) {
                        return "STOP " + se(ev) +
                            " MONITOR " + s(filt.filt, filt[1]);
                    },
                    
                    "deleting scope event" : function (ev, scope) {
                        return "REMOVING SCOPE FOR " + se(ev); // + " " + s(scope);
                    },
                    
                    "overwriting scope event" : function(ev, obj, scope) {
                        return "OVERWRITING SCOPE FOR " + se(ev); 
                        // + " from " + s(scope) + " to " + s(obj);
                    }, 
                    
                    "creating scope event" : function (ev, obj) {
                        return "CREATING SCOPE FOR " + se(ev); // + " now has a scope " + s(obj); 
                    },
                    
                    "on" : function (ev, proto, context) {
                       if (proto.hasOwnProperty('_label') ) {
                            proto = proto._label;
                            if ( (proto.indexOf("(when)" ) === 0) ||
                            (proto.indexOf("(once)") === 0 ) ) {
                                return;
                            }
                        }
                        return "ATTACH " + s(proto) + " TO " + se(ev); 
                        //+ ( (context && context.hasOwnProperty('_label') ) ? 
                        //        " CONTEXT " + s(context._label) : "" ); 
                    },
                    
                    "all handlers removed from all events" : function () {
                        return "ALL HANDLERS WIPED";
                    }, 
                    
                    "handler for event removed" : function (ev, removed) {
                        var ident = s(removed._label) ||
                            se(removed.map(function (el) {return el.summarize();}));
                        return "REMOVING HANDLER " + ident +
                            " FROM " + se(ev);
                    },
                    
                    "removed handlers on event ignoring when" : function (ev) {
                        return "REMOVING NOT WHEN HANDLERS FROM " + se(ev);
                    },
                    
                    "removing all handlers on event" : function (ev) {
                        return "REMOVING ALL HANDLERS FROM " + se(ev);
                    },
                    
                    "once" : function(ev, n, proto, context) {
                        if (proto.hasOwnProperty('_label') ) {
                            proto = proto._label;
                        }
                        return "ATTACH " + s(proto) + " TO " + se(ev) + 
                            " FOR " + se(n);
                            // + ( (context && context.hasOwnProperty('_label') ) ?  " CONTEXT " + s(context._label) : "" ); 
                    },
                    
                    "when" : function (events, ev, timing, reset) {
                        return "WHEN: " + se(ev) + 
                            " AFTER: " + 
                            se(events) + 
                            ( timing ? " TIMING " + s(timing) : "" ) +
                            ( reset ? " (RESET ON) " : "" ); 
                    },
                    
                    "when add" : function (events, ev) {
                        return "WHEN: " + se(ev) + 
                            " AFTER: " + 
                            se(events) + "(PLUS OTHERS)";
                    },
                    
                    
                    "removed action" : function(name) {
                        return "ACTION DELETE: " + se(name);
                    },
                    
                    "overwriting action" : function (name, proto) {
                        return "ACTION: " + se(name) + " OVERWRITTEN BY " + s(proto);
                    },
                    
                    "creating action" : function(name, proto, context) {
                        if (proto.hasOwnProperty("_label") ) {
                            proto = proto._label;
                        }
                        return "NEW ACTION " + se(name) +
                            " FUN " + s(proto) + 
                            ( context ?  " CON " + s(context) : "" ); 
                    },
                    
                    "emission stopped" : function (ev) {
                        return "STOPPING " + se(ev); 
                    },
                    
                    "queue cleared of all events" : function () {
                        return "EVENT QUEUE CLEARED";
                    },
                    
                    "event cleared" : function (ev) {
                        return "EVENT" + se(ev) + " CLEARED";
                    },
                    
                    "some events stopped" : function(a, rq, rw) {
                        
                        var qlist = rq.map(function (el) {
                            return el.ev;
                        }); 
                    
                        var wlist = rw.map(function (el) {
                            return el.ev;
                        });  
                    
                        return "STOPING EVENTS " + s(qlist) + s(wlist) + " PER FILTER " + se(a);
                    },
                    
                    "error raised" : function(e, handler, data, evObj, context) {
                        var err = "error " + e + "\n\n" +
                            "event " + 
                            ( (evObj.ev === evObj.cur[0] ) ?
                                s(evObj.ev) :
                                s(evObj.ev, evObj.cur[0]) ) + 
                            "\nhandler " + s(handler) + 
                            "\ndata " + s(data) + 
                            "\ncontext " + s(context) + 
                            "\nscopes " + s(evObj.scopes) + 
                            "\nstack " + e.stack;
                        return err;
                    },
                    
                    "executing action" : function ( value, context, evObj) {
                        var event = evObj.ev;
                        var l = evObj.cur[0].length;
                        event = "'" + event.slice(0, l) + "'" + event.slice(l);
                        return evObj.count + ") " + 
                            "ACTING " + se(value) +
                            " EVENT " + event;
                            //se(evObj.cur[0]);
                            //+ ( context ?  " CON " + s(context) : "" ); 
                    },
                    
                    "action not found" : function (value, evObj) {
                        return  evObj.count + ") " + 
                            " EVENT " +
                            se(evObj.cur[0]); 
                            //+ " NO ACTION " + se(value);
                    },
                    
                    "executing function" : function (value, context, evObj) {
                        /*var f = se(value);
                        if (f === "``") {
                            return ;
                        }*/
                        var n = value._label || value.name;
                        if (!n) {
                            return ;
                        }
                        return evObj.count + ") " + 
                            "EXECUTING " + n + 
                            " EVENT " + 
                            se(evObj.cur[0]); 
                            //+ ( context ?  " with context " + s(context) : "" ); 
                    },
                    
                    "canceling tracker" : function (tracker) {
                        return "CANCEL " + s(tracker._label);
                    }},
                temp;
        
            var ret = function (desc) {
                var args = Array.prototype.slice.call(arguments, 0);
        
                if ( ret.fdesc.hasOwnProperty(desc) ) {
                    temp = fdesc[desc].apply( emitter, args.slice(1) );
                    if (temp) {
                        logs.push( fdesc[desc].apply( emitter, args.slice(1) ) );
                    }
                }
        
                full.push(emitter.serial(args));
            };
        
            ret._logs = logs;
            ret._full = full;
            ret.fdesc = fdesc;
        
            ret.full = function (filt, neg) {
                var arr;
                if (Array.isArray(filt) ) {
                    arr = filt;
                    filt = function (el) {
                        return arr.some(function (partial) {
                            return ( el.indexOf(partial) !== -1 );     
                        });
                    };
                } 
                  
                var f = filter(filt, neg);
                return full.filter(f); 
            };
        
            ret.logs = function (filt, neg) {
                var arr;
                if (Array.isArray(filt) ) {
                    arr = filt;
                    filt = function (el) {
                        return arr.some(function (partial) {
                            return ( el.indexOf(partial) !== -1 );     
                        });
                    };
                } 
                  
                var f = filter(filt, neg);
                return logs.filter(f); 
            };
        
            emitter.log = ret; 
            return ret;
        };
    EvW.prototype.events = function (partial, negate) {
            var emitter = this, 
                handlers = emitter._handlers,
                keys = Object.keys(handlers), 
                filt;
        
            filt = filter(partial, negate);
        
            return keys.filter(filt);
        };
    EvW.prototype.handlers = function (events, empty) {
            var emitter = this, 
                handlers = emitter._handlers, 
                ret = {}; 
        
            if (!events) {
                events = Object.keys(handlers);
            } else if (!Array.isArray(events)) {
                events = emitter.events(events);
            } else if (events[1] === true) {
                events = emitter.events(events[0], events[1]);
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
                emitter.log("removed action", name);
                return name;
            }
            
            var action = new Handler(handler, context); 
        
            if (emitter._actions.hasOwnProperty(name) ) {
                emitter.log("overwriting action", name, handler,
                    emitter._actions[name], action);
            } else {
                emitter.log("creating action", name, handler, 
                    context, action); 
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
            var s = emitter.serial;
            var err = "error " + e + "\n\n" +
                "event " + 
                ( (evObj.ev === evObj.cur[0] ) ?
                    s(evObj.ev) :
                    s(evObj.ev, evObj.cur[0]) ) + 
                "\nhandler " + s(handler) + 
                "\ndata " + s(data) + 
                "\ncontext " + s(context) + 
                "\nscopes " + s(evObj.scopes) + 
                "\nstack " + e.stack;
            console.log(err);
            emitter.log("error raised", e, handler, data, evObj, context);
            throw Error(e);
        };
    
    EvW.prototype.filter = filter;
    EvW.prototype.decycle = decycle;
    EvW.prototype.serial = serial;

    if (module) {
        module.exports = EvW;
    } else {
        this.EventWhen = EvW;
    }

} () );