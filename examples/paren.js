/*global require, console, process*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.on("text ready", function (text, emitter) {
        var global = {};
    
        global.store = [[]];
        global.original = text;
        global.text = text.split();
    
        emitter.on("next character", function (char) {
                global.store[0].push(char);
            
                switch (char) {
                    case "(" :
                    case "{" :
                    case "[" :
                        emitter.emit("open bracket", char);
                    break;
                    case ")" :
                    case "}" :
                    case "]" :
                        emitter.emit("close bracket", char);
                    break;
                    case "'":
                    case "\"" :
                        emitter.emit("quote", char);
                    break;
                    case "\\" :
                        emitter.emit("escape", char);
                    break;
                }
            
                char = global.text.shift();
                if (char) {
                    emitter.emit("next character", char);
                } else {
                    emitter.emit("text processing done");
                }
            
            }); 
    
        emitter.on("open bracket", function () {
            
            });
    
        emitter.on("close bracket", function () {
            
            });
    
        emitter.on("quote", function () {
            
            });
    
        emitter.on("escape", function () {
            
            });
    
        emitter.on("text processing done", function () {
                emitter.log.print();
                console.log(global.store);
            });
    
        emitter.emit("next character", global.text.shift());
    
    });

var text = "(cool, [great] right)";

emitter.emit("text ready", text);