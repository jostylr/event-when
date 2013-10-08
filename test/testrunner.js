/*global require, console, process*/
var EventWhen = require('../index.js'),
    Test = require('./test.js'),
    tester = new EventWhen(),
    key;
    
var records = {
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
            
                console.log("once setting up");
                
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
            
                console.log("done with", key);
            
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