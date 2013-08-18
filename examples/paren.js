/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.on("text ready", function (text, emitter) {
        var global = {};
    
        global.store = [[]];
        global.original = text;
        global.text = text.split('');
    
        emitter.on("next character", function (char) {
                var global = this;
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
                        console.log(char);
                        emitter.emit("close bracket", {rightbracket:char});
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
            
            }, global); 
    
        emitter.on("open bracket", function (char) {
                var global = this;
                var newstore,
                    leftbracket,
                    handlers = {},  
                    rightbracket;
            
                var brackets = {
                    "(" : ")",
                    "[" : "]",
                    "{" : "}"
                };
            
                leftbracket = char; 
                newstore = [char];
                global.store.push(newstore);
            
                handlers.pusher = emitter.on("next character", function (char) {
                    this.push(char);
                }, newstore).last;
            
                handlers.open = emitter.on("open bracket", function () {
                    handlers.close.add("close bracket");
                });
            
                handlers.close = emitter.when("close bracket", [function (char) {
                        rightbracket = char;
                        if (brackets[leftbracket] !== rightbracket) {
                            emitter.emit("mismatched brackets", [leftbracket+rightbracket, newstore.join('')]);
                        } else {
                            emitter.emit("matching brackets", newstore.join(''));
                        }
                    }, function (d, emitter) {
                        var handlers = this;
                    
                        emitter.off("next character", handlers.pusher);
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }.bind(handlers)]).last;
            
                handlers.fail = emitter.on("text processing done", function (d, emitter) {
                        var handlers = this;
                    
                        emitter.off("next character", handlers.pusher);
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }, handlers).last;
            
            }, global);
    
        emitter.on("quote", function () {
            
            }, global);
    
        emitter.on("escape", function () {
            
            }, global);
    
        emitter.on("text processing done", function () {
                //emitter.log.print();
                console.log(global.store.map(function (el) {return el.join('');}) );
            }, global);
    
        emitter.emit("next character", global.text.shift());
    
    });

var text = "(cool, [great] right) yay!";

emitter.emit("text ready", text);