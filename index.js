var EvW = function () {

    var handlers = this._handlers = {};
    var queue = this._queue = [];

    return this; 
};

EvW.prototype.on = function (ev, f, that, first) {
        ev = ev.toLowerCase();
        that = that || {};
        if (handlers.hasOwnProperty(ev)) {
            if (first) {
                handlers[ev].unshift([f, that]);
            } else {
                handlers[ev].push([f, that]);
            }
        } else {
            handlers[ev] = [[f,that]];
        }
    
        return this;
    };
EvW.prototype.emit = function (ev, data, that, immediate) {
        if (this.log) {
            this.log(ev, data, that, immediate, handlers[ev]);
        }
    
        ev = ev.toLowerCase();
    
        var h = handlers[ev], i, n, q;
    
        if (h) {
            q = [];
            n = h.length;
            for (i = 0; i < n; i+=1 ) {
                q.push([h[i][0], that || h[i][1] || {}]);
            }
            q = [ev, data || {}, q];
            if (immediate === true) {
                queue.unshift(q);
            } else {
                queue.push(q);
            }
            this.resume();
        }
        return this;
    };
EvW.prototype.off = function (ev, fun) {
    
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
            (function (handlers, f) {
                    var i, n = handlers.length;
                    for (i = 0; i < n; i += 1) {
                        if (handlers[i][0] === f) {
                            handlers.splice(i, 1);
                            i -= 1;
                        }
                    }
                }   )(handlers[ev], fun);
        }
    
        return this;
    };
EvW.prototype.stop = function (a) {
        var i, n; 
    
        if (arguments.length === 0) {
            while (queue.length > 0 ) {
                queue.pop();
            }
        }
        if (typeof a === "string") {
            n = queue.length;
            for (i = 0; i < n; i += 1) {
                if (queue[i][0] === a) {
                    queue.slice(i, 1);
                    i -= 1; 
                }
            }
        }
        if (a === true) {
            queue.shift();
        }
    
        return this;
    };
EvW.prototype.resume = function (gcd) {
        return function () {
            var q, h, f, that, ev, data, cont, cur; 
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
                    that = h[1];
                    ev = cur[0];
                    data = cur[1];
                    if (f.log) {
                        f.log(ev, data, that);
                    }
                    cont = f.call(that, data);
                    if (cont === false) {
                        queue.shift(); 
                    }
                }
                gcd.next(gcd.resume);
             }
         };
    };

EvW.prototype.next =  (typeof process !== "undefined" && process.nextTick) ? process.nextTick : (function (f) {setTimeout(f, 0);});

EvW.prototype.dump = function () {
    return [handlers, queue, log];
};