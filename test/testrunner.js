/*global require, console, process*/
var EventWhen = require('../index.js'),
    Test = require('./test.js'),
    tester = new EventWhen(),
    key;
    
var records = {
    "basic again" : function () {
        
            var emitter = new EventWhen();
            var key = 'basic again';
        
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