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