/*global require, console*/

var EventWhen = require('../index.js');
var emitter = new EventWhen();
emitter.makeLog();

emitter.on("text ready", function (text, emitter) {
        var global = {};
    
        global.store = [[]];
        global.original = text;
        global.text = text.split('');
    
        emitter.on("next character", [global, function (command, char) {
                var global = this;
                global.store[0].push(char);
            
                if (command === "check") {
                    switch (char) {
                        case "(" :
                        case "{" :
                        case "[" :
                            emitter.emit("open bracket", char);
                        break;
                        case ")" :
                        case "}" :
                        case "]" :
                            emitter.emit("close bracket", {rightbracket:char});
                        break;
                        case "'":
                        case "\"" :
                            emitter.emit("quote", char);
                        break;
                        case "\\" :
                            global.store[0].pop(); // fix this later 
                            emitter.emit("escape", char);
                        break;
                    }
                }
            
                char = global.text.shift();


                if (char) {
                    emitter.emit("next character", char);
                } else {

                    emitter.emit("text processing done");
                }
            
            }, "check"]); 
    
        emitter.on("open bracket", [global, function (char) {
                var global = this;
                var newstore,
                    leftbracket,
                    handlers = {},  
                    rightbracket;
            
                var brackets = {
                    "(" : ")",
                    "[" : "]",
                    "{" : "}",
                    ")" : ")",
                    "]" : "]",
                    "}" : "}"
                };
            
                leftbracket = char; 
                newstore = [char];
                global.store.push(newstore);
            
                handlers.pusher = emitter.on("next character", [newstore, function (char) {
                    this.push(char);
                }]).last;
            
                emitter.on("literal character", handlers.pusher);
            
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
                        emitter.off("literal character", handlers.pusher);
                    
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }.bind(handlers)]).last;
            
                handlers.fail = emitter.on("text processing done", [handlers, function (d, emitter) {
                        var handlers = this;
                    
                        emitter.off("next character", handlers.pusher);
                        emitter.off("literal character", handlers.pusher);
                    
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }]).last;
            
            }]);
    
        emitter.on("quote", [global, function () {
            
            }]);
    
        emitter.on("escape", [global, function (d, emitter) {
                var global = this;
            
                var escaped = global.text.shift(); 
                switch (escaped) {
                    case "t" : 
                        emitter.emit("next character", "\t");
                    break;
                    case "n" : 
                        emitter.emit("next character", "\n");
                    break;
                    default: 
                        emitter.emit("literal character", escaped);
                }
            
            }]);
    
        emitter.on("literal character", [global, function (command, char) {
                var global = this;
                global.store[0].push(char);
            
                if (command === "check") {
                    switch (char) {
                        case "(" :
                        case "{" :
                        case "[" :
                            emitter.emit("open bracket", char);
                        break;
                        case ")" :
                        case "}" :
                        case "]" :
                            emitter.emit("close bracket", {rightbracket:char});
                        break;
                        case "'":
                        case "\"" :
                            emitter.emit("quote", char);
                        break;
                        case "\\" :
                            global.store[0].pop(); // fix this later 
                            emitter.emit("escape", char);
                        break;
                    }
                }
            
                char = global.text.shift();
                if (char) {
                    emitter.emit("next character", char);
                } else {
                    emitter.emit("text processing done");
                }
            
            }, "store only"]);
    
        emitter.on("text processing done", [global, function () {
                //emitter.log.print();
                console.log(global.store.map(function (el) {return el.join('');}) );
            }]);
    
        emitter.emit("next character", global.text.shift());
    
    });

var text = "(cool, ( [great] right) yay!";


emitter.emit("text ready", text);


var text2 = "We shall use \\( just a little \\\\ \\t (some escaping \\( for \\) us) right?";
console.log(text2);
emitter.emit("text ready", text2);

//emitter.log.print();