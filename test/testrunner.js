/*global require, console*/
var EventWhen = require('../index.js'),
    Test = require('./test.js');

var tests = {
    "basic on/emit test" : function () {
        
            var emitter = new EventWhen();
        
            var output = [
                "first fires",
                "second fires"
                ],
                input = [];
            
        
            emitter.on("first ready", function () {
                input.push("first fires");
                emitter.emit("second ready");
            });
        
            emitter.on("second ready", function () {
                input.push("second fires");
            });
        
            emitter.emit("first ready");
        
            return Test.same(input, output);
        },
    "simple once test" : function () {
        
            var emitter = new EventWhen();
        
            var output = [
                "first fires",
                "second fires",
                "second fires"
                ],
                input = [];
            
        
            emitter.once("first ready", function () {
                input.push("first fires");
                emitter.emit("second ready");
            });
        
            emitter.once("second ready", function () {
                input.push("second fires");
            }, 2);
        
            emitter.emit("first ready");
            emitter.emit("first ready");    
            emitter.emit("second ready");
        
            return Test.same(input, output);
        },
    "turning off a handler" : function () {
        
            var emitter = new EventWhen();
        
            var output = [
                "first fires",
                "second fires",
                "second fires"
                ],
                input = [];
            
        
            var h = emitter.on("first ready", function () {
                input.push("first fires");
                emitter.emit("second ready");
            });
        
            emitter.on("first ready", function () {
                input.push("second fires");
            });
        
            emitter.emit("first ready");
            emitter.off("first ready", h);
            emitter.emit("first ready");    
            emitter.emit("second ready");
        
            return Test.same(input, output);
        },
    ".when waiting for 2 events" : function () {
        
            var emitter = new EventWhen();
        
            var output = [
                "when fired"
                ],
                input = [];
            
        
            emitter.when(["first ready", "second ready"], function () {
                input.push("when fired");
            });
        
            emitter.emit("first ready");
            emitter.emit("first ready");    
            emitter.emit("second ready");
            emitter.emit("first ready");    
            emitter.emit("second ready");
        
            return Test.same(input, output);
        },
    "checking action naming" : function () {
        
            var emitter = new EventWhen();
        
            var output = [
                "first fired"
                ],
                input = [];
            
        
            emitter.action("fire the first one", function () {
                input.push("first fired");
            });
        
            emitter.on("first ready", "fire the first one");
        
            emitter.emit("first ready");
        
            return Test.same(input, output);
        },
    "checking handlers and events" : function () {
        
            var emitter = new EventWhen();
        
            var expected = [
                "first : great",
                "second",
                "first : great",
                "first : greatsecond",
                "works",
                "worksyadda"
                ],
                actual = [];
            
        
            emitter.on("first : great",  "works");
        
            emitter.on("second", "yadda");
        
            actual.push(emitter.events(":").join(''));
        
            actual.push(emitter.events(":", true).join(''));
         
            actual.push(emitter.events(function (ev) {
                if (ev === "first : great") {
                    return true;
                } else {
                    return false;
                }
            }).join(''));
        
            actual.push(emitter.events().join(''));
        
            actual.push(emitter.handlers(["first : great"])["first : great"][0].value[0]);
        
            // handlers
            (function () {
                var key, str='', hs; 
                hs = emitter.handlers();
                for (key in hs) {
                    str += hs[key][0].value[0];
                }
                actual.push(str);
            } () );
        
            return Test.same(actual, expected);
        },
    "handler with context" : function () {
        
            var emitter = new EventWhen();
        
            var expected = [
                "jt:hi!"
                ],
                actual = [];
            
        
            emitter.on("first ready", function (data, emitter, ev, args) {
                var self = this;
                actual.push(self.name + ":" + args);
            }, {name:"jt"}, "hi!");
        
            emitter.emit("first ready");
        
            return Test.same(actual, expected);
        }
};

var key, result, fail = 0;

for (key in tests ) {
    result = tests[key]();
    if (result) {
        console.log("passed: " + key);
    } else {
        console.log("FAILED: " + key);
        fail += 1;
    }
}

if (fail) {
    throw(fail + " number of tests failed!");
}