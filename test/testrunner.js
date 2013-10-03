/*global require, console, process*/
var EventWhen = require('../index.js'),
    Test = require('./test.js'),
    tester = new EventWhen();
    
var records = {
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
            
        
            emitter.on("first ready", function (data, emitter, args) {
                var self = this;
                actual.push(self.name + ":" + args);
            }, {name:"jt"}, "hi!");
        
            emitter.emit("first ready");
        
            return Test.same(actual, expected);
        },
    "Handler with two handles" : function () {
        
            var emitter = new EventWhen();
        
            var expected = [
                "jt:hi!",
                "action fired received"
                ],
                actual = [];
            
        
            emitter.on("first ready", [function (data, emitter, args) {
                var self = this;
                actual.push(self.name + ":" + args);
            }, "an action fired"], {name:"jt"}, "hi!");
        
            emitter.on("an action fired", function () {
                actual.push("action fired received");
            });
        
            emitter.emit("first ready");
        
            return Test.same(actual, expected);
        
        },
    "canceling" : function () {
        
            var emitter = new EventWhen();
        
            var expected = [
                "emit this",
                "emit that 1",
                "emit that 2",
                "seen because the handler array is not stopped"
                ],
                actual = [];
            
            emitter.on("emit this", [function () {
                    actual.push("emit this");
                    return false;
                }, function () {
                    actual.push("not actually ever seen");
            }]);
        
            emitter.on("emit this", [function () {
                    actual.push("not seen either");
            }]);
        
            emitter.on("emit that", [function () {
                    actual.push("emit that 1");
            }]);
        
            emitter.on("emit that", [function (data, emitter) {
                    actual.push("emit that 2");
                    emitter.stop(true);
                }, function () {
                    actual.push("seen because the handler array is not stopped");
            }]);
        
            emitter.on("emit that", [function () {
                    actual.push("never seen as it gets canceled beforehand");
            }]);
        
            emitter.emit("emit this");
            emitter.emit("emit that");
        
            return Test.same(actual, expected);
        },
    "error checking" : function () {
        
            var emitter = new EventWhen();
        
            var expected = [
                "error event:awesome\nChecking!",
                "Checking!\nerror event\nawesome"
                ],
                actual = [];
        
            // default error
        
            emitter.on("error event", function () {
                throw Error("Checking!");
            }).name = "awesome";
        
            try {
                emitter.emit("error event");
            } catch (e) {
                actual.push(e.message);
            }
        
            //error overide
        
            emitter.error = function (e, ev, h) {
                actual.push([e.message, ev, h.name].join("\n"));
            };
        
            emitter.emit("error event");
        
            return Test.same(actual, expected);
        }
};

tester.on("passed", function (data) {
        delete records[data];
        console.log("passed: " + data);
    });

tester.on("failed", function (data) {
        console.log("FAILED: " + data.key);
        console.log(data.result);
    }    );

( (function (tests) {
        var key, result; 
    
        for (key in tests ) {
            result = tests[key]();
            if (result === true) {
                tester.emit("passed", key);
            } else {
                tester.emit("failed", {key:key, result:result});
            }
        }
    } ) ( records) );

process.on('exit', function () {
    var n = Object.keys(records).length;
    if ( n > 0 ) {
        throw(n + " number of failures!");
    }
});