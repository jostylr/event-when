/*global require, console, process*/
var EventWhen = require('../index.js'),
    Test = require('./test.js'),
    tester = new EventWhen(),
    key;
    
var records = {
        "basic again" : function () {
            
                var emitter = new EventWhen();
                var key = 'basic again';
            
                emitter.name = key;
            
                var expected = [
                    "first fires",
                    "second fires"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.on("first ready", function () {
                    actual.push("first fires");
                    emitter.emit("second ready");
                });
                
                emitter.on("second ready", function () {
                    actual.push("second fires");
                    emitter.emit("done");
                });
                
                emitter.emit("first ready");
            
            },
        "simple once test" : function () {
            
                var emitter = new EventWhen();
                var key = 'simple once test';
            
                emitter.name = key;
            
                var expected = [
                    "first fires",
                    "second fires",
                    "second fires"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.once("first ready", function () {
                    actual.push("first fires");
                    emitter.emit("second ready");
                });
                
                emitter.once("second ready", function () {
                    actual.push("second fires");
                }, 2);
                
                emitter.emit("first ready");
                emitter.emit("first ready");    
                emitter.emit("second ready");
                emitter.emit("done");
            
            },
        "turning off a handler" : function () {
            
                var emitter = new EventWhen();
                var key = 'turning off a handler';
            
                emitter.name = key;
            
                var expected = [
                    "first fires",
                    "second fires",
                    "second fires"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                var h = emitter.on("first ready", function () {
                    actual.push("first fires");
                    emitter.emit("second ready");
                });
                
                emitter.on("first ready", function () {
                    actual.push("second fires");
                });
                
                emitter.emit("first ready");
                emitter.off("first ready", h);
                emitter.emit("first ready");    
                emitter.emit("second ready");
                
                emitter.emit("done");
            
            },
        ".when waiting for 2 events" : function () {
            
                var emitter = new EventWhen();
                var key = '.when waiting for 2 events';
            
                emitter.name = key;
            
                var expected = [
                    "when fired"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.when(["first ready", "second ready"], "both ready");
                
                emitter.on("both ready", function () {
                    actual.push("when fired");
                });
                
                emitter.emit("first ready");
                emitter.emit("first ready");
                emitter.emit("second ready");
                emitter.emit("first ready");    
                emitter.emit("second ready");
                
                emitter.emit("done");
            
            },
        "checking action naming" : function () {
            
                var emitter = new EventWhen();
                var key = 'checking action naming';
            
                emitter.name = key;
            
                var expected = [
                    "first fired"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.action("fire the first one", function () {
                    actual.push("first fired");
                });
                
                emitter.on("first ready", "fire the first one");
                
                emitter.emit("first ready");
                
                emitter.emit("done");
            
            },
        "checking handlers and events" : function () {
            
                var emitter = new EventWhen();
                var key = 'checking handlers and events';
            
                emitter.name = key;
            
                var expected = [
                    "first : great",
                    "second",
                    "first : great",
                    "first : greatsecond",
                    "works",
                    "worksyadda"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.off("done");
                
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
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
                
                emitter.emit("done");
            
            },
        "handler with context" : function () {
            
                var emitter = new EventWhen();
                var key = 'Handler with context';
            
                emitter.name = key;
            
                var expected = [
                    "jt:hi!"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.on("first ready", function (data, emitter, args) {
                    var self = this;
                    actual.push(self.name + ":" + args);
                }, {name:"jt"}, "hi!");
                
                emitter.emit("first ready");
                
                emitter.emit("done");
            
            },
        "handler with two handles" : function () {
            
                var emitter = new EventWhen();
                var key = 'Handler with two handles';
            
                emitter.name = key;
            
                var expected = [
                    "jt:hi!",
                    "action fired received"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.on("first ready", [function (data, emitter, args) {
                    var self = this;
                    actual.push(self.name + ":" + args);
                }, "an action fired"], {name:"jt"}, "hi!");
                
                emitter.on("an action fired", function () {
                    actual.push("action fired received");
                });
                
                emitter.emit("first ready");
                
                emitter.emit("done");
            
            },
        "canceling" : function () {
            
                var emitter = new EventWhen();
                var key = 'canceling';
            
                emitter.name = key;
            
                var expected = [
                    "emit this",
                    "emit that 1",
                    "emit that 2",
                    "seen because the handler array is not stopped"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
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
                
                emitter.emit("done");
            
            },
        "error checking" : function () {
            
                var emitter = new EventWhen();
                var key = 'error checking';
            
                emitter.name = key;
            
                var expected = [
                    "error event:awesome\nChecking!",
                    "Checking!\nerror event\nawesome"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
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
                
                emitter.emit("done");
            
            },
        "flow testing" : function () {
            
                var emitter = new EventWhen();
                var key = 'flow testing';
            
                emitter.name = key;
            
                var expected = [
                    "A",
                    "B",
                    "C",
                    "E",
                    "D"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.on("A", function () {
                    actual.push("A");
                    emitter.later("C");
                });
                emitter.on("C", function () {
                    actual.push("C");
                    emitter.later("D");
                });
                emitter.on("B", function () {
                    actual.push("B");
                    emitter.later("E");
                });
                
                emitter.on("D", function () {
                    actual.push("D");
                });
                
                emitter.on("E", function () {
                    actual.push("E");
                });
                
                emitter.when(["A", "B", "C", "D", "E"], "done");
                
                emitter.emit("A");
                emitter.emit("B");
            
            },
        ".when with later" : function () {
            
                var emitter = new EventWhen();
                var key = '.when with later';
            
                emitter.name = key;
            
                var expected = [
                    "A",
                    "B",
                    "E",
                    "D",
                    "C"
                    ],
                    actual = [];
                
                emitter.on("done", function () {
                    var result;
                
                    result = Test.same(actual, expected);
                    if (result === true ) {
                       tester.emit("passed", key);
                    } else {
                        tester.emit("failed", {key:key, result:result});
                    }    
                });
            
                emitter.on("A", function () {
                    actual.push("A");
                });
                emitter.on("B", function () {
                    actual.push("B");
                });
                
                emitter.on("C", function () {
                    actual.push("C");
                });
                
                emitter.on("D", function () {
                    actual.push("D");
                });
                
                emitter.on("E", function () {
                    actual.push("E");
                });
                
                emitter.when(["A", "B"], "C", {timing: "later"});
                
                emitter.when(["A", "B"], "D", {timing: "firstLater"});
                
                emitter.when(["A", "B"], "E");
                
                var temp = emitter.when(["A", "B", "C", "D", "E"], "done");
                
                emitter.emit("A");
                emitter.emit("B");
            
            }
};

tester.on("passed", function (key) {
        key = key.toLowerCase();
        delete records[key];
        console.log("passed: " + key);
    });

tester.on("failed", function (data) {
        console.log("FAILED: " + data.key);
        console.log(data.result);
    }    );

for (key in records) {
    records[key]();
}

process.on('exit', function () {
    var n = Object.keys(records).length;
    if ( n > 0 ) {
        console.log("Remaining keys:", Object.keys(records));
        throw(n + " number of failures!");
    }
});