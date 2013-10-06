function () {

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