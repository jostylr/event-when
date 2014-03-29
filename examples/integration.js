 /*global require, console, process*/
 /*jshint evil:true*/
var EventWhen = require('../index.js'),
    emitter = new EventWhen(), 
    actual = {};

emitter.makeLog(10, 4);

var fs = require('fs');

emitter.scope("actual", {});

emitter.on("start", "load expected");

emitter.on("ready expected.json", "store expected");

emitter.on("ready expected.json", "queue files");

emitter.on("list ready:files", "load files");

emitter.on("ready", "run");

emitter.on("done", "store", actual);

var when = emitter.when("list ready", "list done");

emitter.on("saved:actual.json", "compare", actual);

emitter.on("list done", "save", actual);

emitter.on("fail", "register failure");

emitter.scope("fail", {});

emitter.on("all done:pass", "report success");

emitter.on("all done:fail", "throw failure");

emitter.action("load expected", function (data, evObj) {
    var emitter = evObj.emitter;
    fs.readFile("expected.json", {encoding : "utf8"}, 

        function(err, text) {
            if (err) {
                throw Error(err);
            }
            emitter.emit("ready expected.json", JSON.parse(text)); 
        });
    
    }
);

emitter.action("store expected", function (data, evObj) {
    var emitter = evObj.emitter;
    emitter.scope("expected", data); 
});

emitter.action("queue files", function (data, evObj) {
    var emitter = evObj.emitter;
    var files = Object.keys(data);
    emitter.scope("files", files); 
    files.forEach(function (el) {
        when.add("done:"+el);
    });
    emitter.emit("list ready:files");
});
    
emitter.action("load files", function (data, evObj) {
    var emitter = evObj.emitter;
    var files = evObj.scopes.files;
    files.forEach(function (el) {
        fs.readFile(el, {encoding:"utf8"}, 

        function (err, text) {
            if (err) {
                throw Error(err);
            } 
            emitter.emit("ready:"+el, text);
        });
    });
});

emitter.action("run", function (data, evObj) {
    var fname = evObj.pieces[0];
    var emitter = evObj.emitter;

    var script = "var act = ''; var cl = function(str) {act +=str;};" +
        data.replace(/console\.log/g, "cl") +
        "return act";

    var f = new Function("require", script);

    emitter.emit( "done:"+fname, f(require) );
    
});

emitter.action("store", function (data, evObj) {
    var fname = evObj.pieces[0];

    var actual = this;

    actual[fname] = data;

});

emitter.action("compare", function (data, evObj) {
    var emitter = evObj.emitter;
    var expected = emitter.scope("expected");
    var actual = this; 
    var exl = Object.keys(expected).length;
    var acl = Object.keys(actual).length;
    var flag = "pass";
    var key; 

    if  (exl !== acl) {
        emitter.emit("fail:keys", [exl, acl] );
        flag = "fail";
    } else {

        for (key in expected) {
            if (expected[key] !== actual[key]) {
                emitter.emit("fail:"+key, [expected[key], actual[key]]);
                flag = "fail";
            }
        }

    }

    emitter.emit("all done:"+flag);

});

emitter.action("register failure", function (data, evObj) {
    var fail = evObj.scopes.fail;
    var key = evObj.pieces[0];
    fail[key] = data;
    
});

emitter.action("report success", function () {
    console.log("success");
});

emitter.action("throw failure", function (data, evObj) {
    var fail = evObj.scopes.fail;

    throw "test failed: " + Object.keys(fail).join(",");

});

emitter.action("save", function (data, evObj) {
    var actual = this;
    var emitter = evObj.emitter;

    fs.writeFile('actual.json', JSON.stringify(actual), 
        function (err) {
            if (err) {
              throw err;
            }
            
            emitter.emit("saved:actual.json");
            
    });
});

emitter.emit("start");
   
process.on("exit", function () {
       // console.log(emitter.log.logs() ); 
    } );