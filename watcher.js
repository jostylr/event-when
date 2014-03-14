var fs = require('fs');
var exec = require('child_process').exec,
    child;

var out = function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
};

fs.watchFile("eventwhen.md", function () {
    exec("./mon.sh", out);
});

fs.watchFile("test/test.md", function () {
    exec("./mon.sh", out);
});

exec("./mon.sh", out);
