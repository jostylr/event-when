var EvW = function () {

    var this._handlers = {};
    var this._queue = [];

    var this.resume = resume.bind(this);

    return this; 
};

EvW.prototype.on = function (ev, f, first) {
        ev = ev.toLowerCase();
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
    
        return this;
    };
EvW.prototype.emit = function (ev, data,  immediate) {
        if (this.log) {
            this.log(ev, data, immediate, handlers[ev]);
        }
    
        ev = ev.toLowerCase();
    
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
EvW.prototype.off = function (ev, fun) {
    
        var handlers = this._handlers;
    
        if (ev) {
            ev = ev.toLowerCase();
        }
    
        if (arguments.length === 0) {
            (function (obj) {
                    var key; 
                    for (key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            delete obj.key;
                        }
                    }
                })(handlers);
        } if (arguments.length === 1) {
            delete handlers[ev];
        } if (arguments.length === 2) {
            handlers[ev] = handlers[ev].filter(function (el) {
                if (el === fun) {
                    return false;
                } else {
                    return true;
                }
            }); 
        }
    
        return this;
    };
EvW.prototype.stop = function (a) {
        var i, n; 
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
        var q, h, f, ev, data, cont, cur; 
        var queue = this._queue;
    
        console.log(queue.slice());
        if (queue.length >0) {
            cur = queue[0];
            q = cur[2];
            h = q.shift();
            if (q.length === 0) {
                queue.shift();
            }
            if (h) {
                f = h[0];
                ev = cur[0];
                data = cur[1];
                if (f.log) {
                    f.log(ev, data);
                }
                cont = f(data);
                if (cont === false) {
                    queue.shift(); 
                }
            }
            this.next(this.resume);
        }
    };

EvW.prototype.next =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick : (function (f) {setTimeout(f, 0);});

EvW.prototype.dump = function () {
    return [handlers, queue, log];
};