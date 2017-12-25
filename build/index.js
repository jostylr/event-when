/*jshint eqnull:true,esversion:6 */
/*global setTimeout, setImmediate, module, console */

;(function () {
    var empty = {};

    var noop = function () {};

    let identity = a=>a;

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

    var Handler = function (fullAction, f, context, emitter) {
        const handler = this;
        let i, contextStr, action;
        handler.fullAction = fullAction;
        if ( (i = fullAction.indexOf(":")) !== -1) {
            action = handler.action = fullAction.slice(0,i);
            contextStr = handler.contextStr = fullAction.slice(i+1);
            if (contextStr === '*') {
                contextStr = action;
            }
            if (typeof context === 'undefined') {
                context = emitter.scope(true, contextStr);
            }
        } else {
            handler.action = fullAction;
        }
        handler.emitter = emitter;
        if (typeof f === 'function') {
            handler.f = f;
            Object.defineProperty(f, 'name', {
                value:(f.name||'') + ":" +
                    fullAction, configurable:true});
    
        }
    
        handler.context = context;
    
        return handler;
    };

    Handler.prototype.execute = function me (data, target, emitter, evObj) {
        
        const handler = this;
        const raw = emitter._actions.get(handler.action) || {};
    
        const f = this.f || raw.f;
    
        let context = this.context || raw.context;
        
        if (typeof target === 'undefined') {
            if  (handler.scopeObj) {
                target = emitter.scope(true, evObj[4]);
            } else {
                target = evObj[4];
            }
        }
        emitter.log("executing action", handler.action, data, target, evObj);
    
        f.call(handler, data, target, emitter, context, evObj, raw);
    
        return handler;
    
    }; 
    Handler.prototype.removal = function me (ev, emitter) {
        let handler =  this;
    
        if ( handler.hasOwnProperty("tracker") ) {
            handler.tracker._removeStr(ev);
            emitter.log("untracked", ev, handler.tracker, handler);
            return ;
        }
    
        return;
    };

    var Tracker = function (options, emitter, action, events, ev) {
        let tracker = this;
    
        tracker.emitter = emitter;
        tracker.events = [];
        tracker.toEmit = ev;
        tracker.action = action;
        tracker.originals = events.slice(0);
        tracker.handlers = new Map();
        tracker.pipes = new Map();
        tracker.values = new Map();
        tracker.emits = [];
        tracker.silents = new Set(options.silents);
        
        tracker.reset = options.reset || false;
        
        return this;
    };

    Tracker.prototype.add = function (events) {
        let tracker = this;
        let emitter = tracker.emitter;
        let action = tracker.action;
        
        tracker.originals = tracker.originals.concat(events.map( event => {
            let n, pipe, initial, arr;
            if (Array.isArray(event) ) {
                arr = event;
                [event, n, pipe, initial] = arr;
            }
            if (typeof event !== 'string') {
                emitter.error('event to listen for should be string', event);
                return null;
            }
            n = (typeof n === 'number') ? n : 1;
            let handler = emitter.once(event, action, n);
            tracker.handlers.set(event, handler);
            tracker.pipes.set(event, (typeof pipe !== 'undefined') ?  pipe : identity);
            tracker.values.set(event, initial);
            return event;
        }));
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
        this._actions.set("_cache", function (data, ev, scope, emitter, context, evObj) {
            let cache = context.get(ev);
            if (!cache) {
                cache = [];
                context.set(ev, cache);
            }
            cache.push(data, evObj);
        
            return emitter;
        });
        this._actions.set("_when", function (data, scope, emitter, context, event) {
            let handler = this;
            let tracker = context;
            let handlers = tracker.handlers;
        
            
        
            if (handler.count === 0) {
                emitter.handlers.delete(handler.event);
                if (Array.from(handlers.keys()).length === 0) {
                    
                }
            }
        
        });
        this._onceCache = new Map();
        this._queue = [];
        this._monitor = [];
        this._looping = false;
        this.loopMax = 1000;
        this.loop = 0;
        this.emitCount = 0;
        this.whens = {};
        this._cache = {};
        this.initialOrdering = false;  // for .when tracker behavior
    
        this.looper = this.looper.bind(this);
    
        this._label = "emitter";
    
        return this; 
    };

    EvW.prototype._emit = EvW.prototype.emit = function (ev,  data, target) {
        const emitter = this; 
        let evObj;
    
        if (typeof ev !== "string") {
            emitter.error("event string is not a string", [ev, data]); 
            return;
        }
    
        evObj = [ev, data, target]; //the emit arguments come first.
        let colIndex = ev.indexOf(":");
        let actions;
        const handlers = emitter._handlers;
        if (colIndex === -1) {
            evObj.push(ev, null);
            actions = handlers.get(ev);
            if (actions) {
                evObj.push(emitter.decrement(actions.slice(0)));
            } else {
                emitter.log("emit without action", ev, data, target);
                return emitter;
            }
        } else {
            const gen = ev.slice(0,colIndex);
            const scope = ev.slice(colIndex+1);
            evObj.push(gen, scope);
        
            const specifics = handlers.get(ev);
            const generals = handlers.get(gen);
            if (specifics && generals) {
                actions = emitter.decrement(specifics.slice(0), ev).
                    concat(emitter.decrement(generals.slice(0), gen));
            } else if (specifics) {
                actions = emitter.decrement(specifics.slice(0), ev);
            } else if (generals) {
                actions = emitter.decrement(generals.slice(0), gen);
            } else {
                emitter.log("emit without action", ev, data, target);
                return emitter;
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
    EvW.prototype.scope = function (key, obj, tobj) {
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
        if (key === true) {
            key = obj;
            obj = emitter._scopes.get(key);
            if (typeof obj === 'undefined') {
                if (typeof tobj !== 'undefined') {
                    emitter._scopes.set(key, tobj);
                    return tobj;
                } else {
                    obj = Object.create(null);
                    emitter._scopes.set(key, obj);
                }
            }
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
        if ( (typeof f !== 'undefined') && (typeof f !== "function")) {
            let temp = f;
            f = context;
            context = temp;
        }
    
        const handlers = emitter._handlers;
    
        let handlerArr = handlers.get(ev);
        if (handlerArr) {
            let i, n = handlerArr.length; 
            for (i=0; i < n; i +=1) {
                if (handlerArr[i].fullAction === action) {
                    emitter.log("repeat event-action pair for on", 
                        ev, action);
                    return handlerArr[i];
                }
            }
        } else {
            handlerArr = [];
            handlers.set(ev, handlerArr);
        }
    
        let scopeObj = false;
        let toggle = action[action.length -1];
        if ( ( toggle === '~') ||
             ( toggle === '.') ) {
            action = action.slice(0, -1);
            let g = f;
            f = function wrapper (data, target, emitter, context, evObj, raw) {
                let handler = this;
                if (typeof target === 'undefined') {
                    if  (handler.scopeObj) {
                        target = emitter.scope(true, evObj[4]);
                    } else {
                        target = evObj[4];
                    }
                }
                emitter.log("executing action", handler.action, data, target, evObj);
            
                g = g || raw.f;
                g.call(handler, data, target, emitter, context, evObj);
            };
            scopeObj = (toggle === '~') ? true : false; 
        }
        const handler = new Handler(action, f, context, emitter); 
        handler.event = ev;
        handler.scopeObj = scopeObj;
    
        handlerArr.push(handler);
    
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
    
        let removed = [];
        if (typeof action === 'string') {
            events.forEach( function (ev) {
                if (handlers.has(ev) ) {
                    let place = [];
                    let arr = handlers.get(ev);
                    arr.forEach( (handler, ind) => {
                        if (handler.action === action ) {
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
                emitter.log("handler for event removed", ev, action);
            });
            return emitter;    
        } else if (action) { //presuming a handler to match
            events.forEach( function (ev) {
                if (handlers.has(ev) ) {
                    let place = [];
                    let arr = handlers.get(ev);
                    arr.forEach( (handler, ind) => {
                        if (handler === action ) {
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
                emitter.log("handler for event removed", ev, action.action);
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
            handler = emitter.on(ev, action, f, context);
            if (handler) {
                handler.count = n; 
                emitter.log("once", ev, action, n);
            }
        } else {
            handler = emitter.on(ev, action, n, f);
            if (handler) {
                handler.count = 1;
                emitter.log("once", ev, action, n);
            }
        }
    
        if (ev[ev.length-1] === '~') {
            ev = ev.slice(0,-1);
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
                handler.execute(cache[i][0], scope, emitter, cache[i]);
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
    EvW.prototype.storeEvent = function (ev, off) {
        if (off !== false) {
            const emitter = this;
            emitter.on(ev, "_cache:*");
        } else {
            emitter.off(ev, "_cache");
            emitter.scope("_cache").delete(ev);
        }      
    
        return emitter;
    };
    EvW.prototype.decrement = function (arr, ev) {
        const emitter = this;
        const n = arr.length;
        if (n) {
           let i;
            for (i = 0; i<n; i +=1) {
                if (arr[i].hasOwnProperty('count') ) {
                    arr[i].count -=1; 
                    if (arr[i].count === 0) {
                        emitter.off(ev, arr[i]);
                    }
                }
            }
        }
        
        return arr; 
    
    };
    EvW.prototype.when = function (events, ev, options) {
        const emitter = this;
    
        if (typeof events === 'string') {
            events = [events];
        } else if (! Array.isArray(events) ) {
            emitter.error('events for when must be an array or a string',
                events, ev);
            return emitter;
        }
        
        if (typeof ev !== 'string') {
            emitter.error('emit event must be string for when', events, ev);
            return emitter;
        }
        
        if (typeof options !== 'object') {
            options = {};
        }
    
        let scope = options.scope;
        if (typeof scope === 'undefined') {
            let evInd = ev.indexOf(':');
            if (evInd !== -1) {
                scope =  ev.slice(evInd+1);
            }
        }
        if (scope) {
            events = events.map( a => {
                return (a[a.length-1] === ':') ?
                    a + scope : 
                    a;
            });
        } else {
            events = events.map( a=> {
                return (a[a.length-1] === ':') ?
                    a.slice(0, -1) :
                    a;
            });
        }
    
        let action = 'tick when:'+ ev;
        let proto = emitter.action(action);
        let tracker;
        if (!proto) {
            tracker = new Tracker (options, emitter, action, events, ev);
            emitter.scope("_tracking "+ev, tracker);
            emitter.action(action, "_when", tracker); 
        } else { 
            tracker = proto.context;
        }
    
        tracker.add(events, ev);
        
        
        return tracker;
    };
    EvW.prototype.whenf = function (data, scope, emitter, context, event) {
        let handler = this;
        let tracker = context;
        let handlers = tracker.handlers;
    
        
    
        if (handler.count === 0) {
            emitter.handlers.delete(handler.event);
            if (Array.from(handlers.keys()).length === 0) {
                
            }
        }
    
    };
    EvW.prototype.flatWhen = function (events, ev, options) {
        if (options) {
           options.flatten = true; 
        } else {
            options = {flatten:true};
        }
        return this.when(events, ev, options);
        tracker.flatten = true;
        return tracker;
    };
    EvW.prototype.flatArrWhen = function () {
        let tracker = this.when.apply(this, arguments);
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
            self = emitter.looper;
           
    
        if (emitter._looping) {
            return;
        }
    
    
        emitter._looping = true;
    
        while ( (queue.length) && (emitter.loop < loopMax ) ) {
            let evObj = queue.shift();
            emitter.log('start executing emit', evObj);
            let actions = evObj.pop();
            
            let action; 
            while ( ( action = actions.shift() ) ) {
                emitter.log("will execute handler", action, evObj);
                //evObj = [ev, data, target, gen, scope ]
                action.execute(evObj[1], evObj[2], emitter, evObj);
                emitter.log("done executing handler", action, evObj);
            }
            emitter.log('done with emit', evObj);
            emitter.loop += 1;
        }
    
        emitter._looping = false;
    
        if (queue.length) {
            emitter.log("looping hit max", [emitter.loop, queue]);
            emitter.loop = 0;
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
            fdesc = {           
            },
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
    
        if (typeof name !== 'string') {
            emitter.log("action name needs to be a string", name, f, context);
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
    
        let contextStr, fullAction = name;
        let i = name.indexOf(':');
        if (i !== -1) {
            contextStr = name.slice(i+1); 
            name = name.slice(0,i); 
        }
    
        if (actions.has(name) ) {
            emitter.log("overwriting action", name, f, context,
                actions.get(name));
        } else {
            emitter.log("creating action", name, f, context); 
        }
    
        if ( (typeof f !== 'undefined') && (typeof f !== "function")) {
            let temp = f;
            f = context;
            context = temp;
        }
    
        let o = {};
    
        if (f) {
            o.f = f;
        }
    
        if (typeof contextStr === 'string') {
            o.contextStr = contextStr;
            if (typeof context === 'undefined') {
                context = emitter.scope(true, 'contextStr');
            }
        }
        o.context = context;
        o.fullAction = fullAction;
        
        if (typeof f === 'function') {
            Object.defineProperty(f, 'name', {
                value:(f.name||'') + ":" + fullAction, 
                configurable:true});
        }
    
        actions.set(name, o);
    
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
