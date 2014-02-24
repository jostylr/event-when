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
                "first;fire",
                "second;water",
                "first;water",
                "first;second;fire;water"
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
            
            emitter.on("first",  "works");
            
            emitter.on("second", "yadda");
            
            emitter.on("fire",  "brim");
            
            emitter.on("water",  "works");    
            
            actual.push(emitter.events("fir").join(';'));
            
            actual.push(emitter.events("fir", true).join(';'));
            
            actual.push(emitter.events(function (ev) {
                var h = emitter._handlers[ev];
                if ( h.contains("works", h ) ){
                    return true;
                } else {
                    return false;
                }
            }).join(';'));
            
            actual.push(emitter.events().join(';'));
            
            emitter.on("done", function () {
                var result;
            
                result = Test.same(actual, expected);
                if (result === true ) {
                   tester.emit("passed", key);
                } else {
                    tester.emit("failed", {key:key, result:result});
                }    
            })
            
            emitter.emit("done");
        
        },
    "handler with context" : function () {
        
            var emitter = new EventWhen();
            var key = 'Handler with context';
        
            emitter.name = key;
        
            var expected = [
                "jt:says hi!"
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
        
            emitter.on("first ready", function (data) {
                var self = this;
                actual.push(self.myth.handler.name + 
                    ":" + self.data.handler + 
                    " " + data + self.myth.emit.punctuation);
            }, "says", {name:"jt"});
            
            emitter.emit("first ready", "hi", {punctuation: "!"});
            
            emitter.emit("done");
        
        },
    "handler with two handles" : function () {
        
            var emitter = new EventWhen();
            var key = 'Handler with two handles';
        
            emitter.name = key;
        
            var expected = [
                "one:golden",
                "two:golden",
                "three:golden"
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
        
            emitter.on("first ready", [function (data) {
                actual.push("one:"+data);
            }, "an action fired"]);
            
            emitter.on("first ready", "great");
            
            emitter.action("an action fired", function (data) {
                actual.push("two:"+data);
            });
            
            emitter.action("great", function (data) {
                actual.push("three:"+data);
            });
            
            emitter.emit("first ready", "golden");
            
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
        
            emitter.action("stop emission", function () {
                    actual.push("emit this");
                    this.stop = true;
            });
            
            emitter.action("not seen in array",function () {
                    actual.push("not actually ever seen");
            }); 
            
            emitter.on("bubbling stopping", ["stop emission", "not seen in array" ]);
            
            emitter.on("bubbling stopping", function () {
                    actual.push("not seen either");
            });
            
            emitter.on("stopping test", [function () {
                    actual.push("emit that 1");
            }]);
            
            emitter.on("stopping test", [function () {
                    actual.push("emit that 2");
                    this.emitter.stop(true);
                }, function () {
                    actual.push("seen because the handler array is not stopped");
            }]);
            
            emitter.on("stopping test", [function () {
                    actual.push("never seen as it gets canceled beforehand");
            }]);
            
            emitter.emit("bubbling stopping");
            emitter.emit("stopping test");
            
            emitter.emit("done");
        
        },
    "error checking" : function () {
        
            var emitter = new EventWhen();
            var key = 'error checking';
        
            emitter.name = key;
        
            var expected = [
                "Error: Checking!",
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
            
            var h = emitter.on("error event", function () {
                throw Error("Checking!");
            })
            
            h.name = "awesome";
            
            try {
                emitter.emit("error event");
            } catch (e) {
                actual.push(e.message);
            }
            
            //error overide
            
            emitter.error = function (e, value, data, passin) {
                actual.push([e.message, passin.event, passin.handler.name].join("\n"));
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
                "J",
                "I",
                "K",
                "G",
                "H",
                "B",
                "C",
                "F",
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
                emitter.now("term:I");
                emitter.momentary("term:G");
                emitter.momentary("term:H");
                emitter.now("term:J");
            });
            
            emitter.on("A", function () {
                emitter.now("term:K");
            });
            
            emitter.on("C", function () {
                actual.push("C");
                emitter.later("term:D");
                emitter.soon("term:F");
            });
            emitter.on("B", function () {
                actual.push("B");
                emitter.later("term:E");
            });
            
            emitter.on("term", function () {
                var passin = this;
                actual.push(passin.evObj.pieces[1]);
            });
            
            emitter.when([["term",8]], "done");
            
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
                "A",
                "A",
                "B",
                "E",
                "D",
                "B",
                "D",
                "C",
                "C",
                "A",
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
            
            emitter.when(["A", "B"], "C", "later", true);
            
            emitter.when(["A", "B"], "D", "soon", true);
            
            emitter.when(["A", "B"], "E", "momentary", true);
            
            var temp = emitter.when([["A", 4], ["B", 3], ["C", 3], ["D", 3], ["E", 3]], "done");
            
            emitter.emit("A");
            emitter.emit("B");
            emitter.emit("A");
            emitter.emit("A");
            emitter.emit("B");
            emitter.later("A");
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