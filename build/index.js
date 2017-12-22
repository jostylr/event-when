/*jshint eqnull:true,esversion:6 */
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

    var Handler = function (action, f, context, emitter) {
        const handler = this;
    
        handler.action = action;
        handler.emitter = emitter;
        if (typeof f === 'function') {
            handler.f = f;
        }
        if (context) {
            handler.context = context;
        }
    
        return handler;
    };

    Handler.prototype.execute = function me (data, scope, emitter) {
        
        const handler = this;
        const raw = emitter._actions.get(handler.action) || empty;
    
        const f = this.f || raw.f;
        if (typeof f !== "function") {
            emitter.error("bad function for handler", action);
        }
    
        let context = this.context || raw.context || empty;
    
        if (typeof context === "string") {
            context = emitter.scope(context);
        }
    
        emitter.log("executing action", handler.action);
    
        f.call(context, data, scope, emitter, context);
    
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
    Handler.prototype.decrement = function (ev) {
        const arr = this;
        const n = arr.length;
        if (n) {
           let i;
            for (i = 0; i<n; i +=1) {
                if (arr[i].hasOwnProperty('count') ) {
                    arr[i].count -=1; 
                    if (arr[i].count === 0) {
                        //remove once!!!!!!!
                    }
                }
            }
        }
        
    
        return this; 
    
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
    
        this._handlers = new Map();
        this._scopes = new Map();
        this._actions = new Map();
        this._onces = {};
        this._queue = [];
        this._monitor = [];
        this.scopeSep = ":";
        this._looping = false;
        this.loopMax = 1000;
        this.emitCount = 0;
        this.whens = {};
        this._cache = {};
        this._onceCache = {};
        this.initialOrdering = false;  // for .when tracker behavior
    
        this.looper = this.looper.bind(this);
    
        this._label = "emitter";
    
        return this; 
    };

    EvW.prototype._emit = EvW.prototype.emit = function (ev,  data) {
        const emitter = this; 
        let evObj;
    
        if (typeof ev !== "string") {
            emitter.error("event string is not a string", [ev, data]); 
            return;
        }
    
        let colIndex = ev.indexOf(":");
        let actions;
        const handlers = emitter._handlers;
        if (colIndex === -1) {
            actions = handlers.get(ev);
            if (actions) {
                evObj = [ev, null, data, actions.decrement(ev).slice(0)]; 
            } else {
                emitter.log("emit without action", ev, data);
                return;
            }
        } else {
            evObj = [ev.slice(0,colIndex), ev.slice(colIndex), data];
            const specifics = handlers.get(ev);
            const generals = handlers.get(evObj[0]);
            if (specifics && generals) {
                actions = specifics.decrement(ev).concat(generals.decrement(evObj[0]));
            } else if (specifics) {
                actions = specifics.decrement(ev).slice(0);
            } else if (generals) {
                actions = generals.decrement(evObj[0]).slice(0);
            } else {
                emitter.log("emit without action", ev, data);
                return;
            }
            evObj.push(actions);
        }
    
        emitter._queue.push(evObj);
        
        emitter.log("emit", ev, data);
    
        if (emitter._looping === false) {
            emitter.looper();
        }
    
        return emitter;
    };
    EvW.prototype.emitCache = function (ev, data) {
        const emitter = this;
        let cache = emitter._onceCache.get(ev);
        if (cache) {
            cache.push(data);
        } else {
            emitter._onceCache.set(ev, [data]);           
        }
        emitter.emit(ev, data);
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
    EvW.prototype.scope = function (key, obj) {
        const emitter = this;
    
        if (arguments.length === 0) {
            return Array.from(emitter._scopes.keys());
        }
    
        
        if (arguments.length === 1) {
            return emitter._scopes.get(key);
        }
    
        if ( obj === null ) {
            emitter.log("deleting scope event", key);
            obj = emitter._scopes.get(key);
            emitter._scopes.delete(key);
            return obj;
        }
    
        if (emitter._scopes.has(key) ) {
            emitter.log("overwriting scope", key);
        } else {
            emitter.log("creating scope", key, obj);
        }
    
        emitter._scopes.set(key, obj);
    
        return emitter;
    };
    EvW.prototype.scopes = function (evfilt, neg) {
    
        var emitter = this, 
            f, keys, ret;
    
        keys = emitter.scope();
    
        if (evfilt) {
            f = filter(evfilt, neg);
            keys = keys.filter(f);
        }
    
        ret = {};
        keys.forEach(function (el) {
            ret[el] = emitter.scope(el);
        });
        return ret;
    };
    
    EvW.prototype.on = function (ev, action, f, context) {
        const emitter = this;
    
        if (typeof ev !== "string") {
            emitter.error("bad event for 'on'", ev, action);
            return;
        } else if (typeof action !== "string") {
            emitter.error("bad action for 'on'", ev, action);
        }
        if (typeof f === "string") {
            if (typeof context === "function") {
                let temp = f;
                f = context;
                context = temp;
            } else {
                context = f;
                f = null;
            }
        }
    
        const handlers = emitter._handlers;
    
        const handler = new Handler(action, f, context, emitter); 
    
        let handlerArr = handlers.get(ev);
        if (handlerArr) {
                handlerArr.push(handler);
        } else {
            handlerArr = [handler];
            handlers.set(ev, handlerArr);
            // contains is for searching the handler; it is a method
            handlerArr.contains = Handler.prototype.contains;
            // this decrements any once counters, calling removal as needed
            // must return array.
            handlerArr.decrement = Handler.prototype.decrement;
        }
    
        emitter.log("on", ev, action, f, context); 
    
        return handler;
    
    };
    EvW.prototype.off = function (events, action, nowhen) {
    
        const emitter = this; 
        const handlers = emitter._handlers;
        var h, f;
    
        if ( (events == null) && (action == null) ) {
            handlers.clear();
            emitter.log("all handlers removed from all events");
            return emitter;
        }
    
        if (events == null) {
            events = Array.from(handlers.keys());
        } else if (typeof events === "string") {
            events = [events];
        } else if (typeof events === "function") {
            events = Array.from(handlers.keys()).filter(events);
        } else if (events instanceof RegExp) {
            events = Array.from(handlers.keys()).filter(
                function (el) {
                    return events.test(el);
            });
        }
    
        if ( typeof action === "boolean") {
            nowhen = action;
            action = null;
        }
    
        if (action) {
            events.forEach( function (ev) {
                var removed = [];
                if (handlers.has(ev) ) {
                    let place = [];
                    let arr = handlers.get(ev);
                    arr.forEach( (handler, ind) => {
                        if (handler.contains(action) ) {
                            removed.push(handler);
                            place.unshift(ind);
                        }
                    });
                    place.forEach( ind => arr.splice(ind, 1));
                    if (arr.length === 0) {
                        handlers.delete(ev);
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
                handlers.delete(ev);
                emitter.log("removed handlers on event ignoring when", ev); 
                return emitter;
            } else {
                h = handlers.get(ev);
                while (h.length > 0) {
                    f = h.pop();
                    f.removal(ev, emitter);
                }
                handlers.delete(ev);
                emitter.log("removing all handlers on event", ev);
            }            
        });
        
        return emitter;
    }          ;
    EvW.prototype.once = function (ev, action, n, f, context) {
        const emitter = this;
        let handler;
    
        if (typeof n === "number") {
            handler = emitter.on(ev, action, n, f, context);
            if (handler) {
                handler.count = n; 
                emitter.log("once", ev, action, n);
            }
        } else {
            handler = emitter.on(ev, action, f, context);
            if (handler) {
                handler.count = 1;
                emitter.log("once", ev, action, n);
            }
        }
    
        let cache = emitter._onceCache.get(ev);
        if (cache) {
            let n = Math.min(cache.length, handler.count);
            let colIndex = ev.indexOf(":");
            colIndex = (colIndex === -1) ?  ev.length : colIndex;
            let scope = ev.slice(colIndex);
            let i;
            for (i = 0; i < n; i+=1) {
                handler.count -=1;
                handler.execute(cache[i], scope, emitter);
            }
            if (handler.count === 0) {
                emitter.off(ev, handler);
                return;
            } else {
                return handler;
            }
        }
        
        
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
    
    EvW.prototype.looper = function () {
        let emitter = this,
            queue = emitter._queue,
            loopMax = emitter.loopMax,
            self = emitter.looper,
            loop = 0, 
            f, ev, evObj, events, cur, ind;
    
    
        if (emitter._looping) {
            return;
        }
    
    
        emitter._looping = true;
    
        while ( (queue.length) && (loop < loopMax ) ) {
            evObj = queue.shift();
            let actions = evObj.pop();
            
            let action; 
            while ( ( action = actions.shift() ) ) {
                action.execute(evObj[2], evObj[1], emitter);
            }
            loop += 1;
        }
    
        emitter._looping = false;
    
        if (queue.length) {
            emitter.log("looping hit max", loop);
            emitter.nextTick(self);
        } else {
            emitter.queueEmpty();
        }
    
        return emitter;
    
    };
    EvW.prototype.nextTick =  (typeof setImmediate !== "undefined" ) ? setImmediate
        : (function (f) {setTimeout(f, 0);});
    EvW.prototype.stop = function (a, neg) {
        var queue = this._queue,
            emitter = this,
            ev, rw, rq; 
    
        if (arguments.length === 0) {
            rq = queue.splice(0, queue.length);
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
                    "event " + s(evObj) +  
                    "\nhandler " + s(handler) + 
                    "\ndata " + s(data) + 
                    "\ncontext " + s(context) + 
                    "\nscopes " + s('scopes') + 
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
    EvW.prototype.action = function (name, f, context) {
        const emitter = this;
        const actions = emitter._actions;
    
        if (arguments.length === 0) {
            return Array.from(actions.keys());
        }
    
        if (arguments.length === 1) {
            return actions.get(name);
        }
    
        if ( (arguments.length === 2) && (f === null) ) {
            f =  actions.get(name);
            actions.delete(name);
            emitter.log("removed action", name);
            return f;
        }
        
        if (actions.has(name) ) {
            emitter.log("overwriting action", name, f, context,
                actions.get(name));
        } else {
            emitter.log("creating action", name, f, context); 
        }
    
        actions.set(name,  {
            f : f,
            context : context
        });
    
        return emitter;
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
    EvW.prototype.error = function (e, handler, data, evObj, context) {
        var emitter = this;
        emitter._looping = false;
        var s = emitter.serial;
        var err = "error " + e + "\n\n" +
            "event " + s(evObj) +  
            "\nhandler " + s(handler) + 
            "\ndata " + s(data) + 
            "\ncontext " + s(context) + 
            "\nscopes " + s('scopes') + 
            "\nstack " + e.stack;
        console.log(err);
        emitter.log("error raised", e, handler, data, evObj, context);
        //throw Error(e);
    };
    EvW.prototype.queueEmpty = function () {}; // noop stub
    
    EvW.prototype.filter = filter;
    EvW.prototype.decycle = decycle;
    EvW.prototype.serial = serial;

    if (module) {
        module.exports = EvW;
    } else {
        this.EventWhen = EvW;
    }

} () );
