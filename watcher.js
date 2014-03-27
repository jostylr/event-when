var fs = require('fs');
var exec = require('child_process').exec,
    child;

var flag = false;
var count = 0;

var out = function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) { 
        if ( (flag === false) || (count > 10) ) {
            flag = true; 
            count = 1; 
            exec('say -v Cellos "fail"', function () {});
        } else {
            count += 1;
        }
    } else if (flag === true) {
        exec('say -v Vicki "pass"', function () {});
        flag = false;
        count = 0;
    }
    console.log("------\ndone", new Date()); 
};

fs.watchFile("eventwhen.md", function () {
    exec("./mon.sh", out);
});

fs.watchFile("test/test.md", function () {
    exec("./mon.sh", out);
});

fs.watchFile("examples/emitwhenExamples.md", function () {
    exec("./mon.sh", out);
});

exec("./mon.sh", out);
