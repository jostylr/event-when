/*global require, console*/

var EventWhen = require('../index.js');

var parserF =  function () {
        var emitter = new EventWhen();
        emitter.makeLog();
        emitter.on("text ready", function (text, emitter) {
                var global = emitter.global;
             
                global.original = text;
                global.text = text.split('');
            
                emitter.emit("next character", global.text.shift());
            
            });
    
       var global = {};
    
        global.store = [[]];
    
        emitter.global = global;
    
        emitter.on("next character",  function (char, em, ev) {
                var global = this;
            
                if (Array.isArray(char) ) {
                    global.store[0].push(char[0]);            
                } else {
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
                            emitter.emit("close bracket", {rightbracket:char});
                        break;
                        case "'":
                        case "\"" :
                            emitter.emit("quote", char);
                        break;
                        case "\\" :
                            emitter.emit("escape");
                        break;
                    }
                }
            
                char = global.text.shift();
                if (char) {
                    emitter.emit("next character", char);
                } else {
                    emitter.emit("text processing done");
                }
            
            }, global, "check" );
    
        emitter.on("escape", function () {
            this.store[0].pop(); // fix this later 
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
                    "{" : "}",
                    ")" : ")",
                    "]" : "]",
                    "}" : "}"
                };
            
                leftbracket = char; 
                newstore = [char];
                global.store.push(newstore);
            
                handlers.pusher = emitter.on("next character",  function (char) {
                    if (Array.isArray(char) ) {
                        this.push(char[0]);                
                    } else {
                        this.push(char);
                    }
                }, newstore);
            
                emitter.on("literal character", handlers.pusher);
            
                handlers.open = emitter.on("open bracket", function () {
                    handlers.close.add("close bracket");
                });
            
                handlers.escaper = emitter.on("escape", function () {
                    this.pop(); // fix this later 
                }, newstore);
            
                handlers.close = emitter.when("close bracket", [function (char) {
                        rightbracket = char;
                        if (brackets[leftbracket] !== rightbracket) {
                            emitter.emit("mismatched brackets", [leftbracket+rightbracket, newstore.join('')]);
                        } else {
                            emitter.emit("matching brackets", newstore.join(''));
                        }
                    }, [handlers, function (d, emitter) {
                        var handlers = this;
                    
                        emitter.off("next character", handlers.pusher);
                        emitter.off("literal character", handlers.pusher);
                        emitter.off("escape character", handlers.escaper);
                    
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }]]);
            
                handlers.fail = emitter.on("text processing done", function (d, emitter) {
                        var handlers = this;
                    
                        emitter.off("next character", handlers.pusher);
                        emitter.off("literal character", handlers.pusher);
                        emitter.off("escape character", handlers.escaper);
                    
                        handlers.close.cancel();
                        emitter.off("text processing done", handlers.fail);
                    
                        return true;
                    }, handlers );
            
            }, global);
    
        emitter.on("quote",  function (char, emitter) {
                var global = this; 
                var orig = char;
                var ret = "";
                var qemitter = parserF();
            
                qemitter.off("quote");
                qemitter.off("open bracket");
                qemitter.off("text processing done");
                qemitter.on("quote", function (char) {
                    if (char === orig) {
                        qemitter.emit("end quote");
                    }
                });
                qemitter.on("text processing done", function () {
                    emitter.log("unfinished quote");
                    qemitter.emit("end quote");
                });
            
                qemitter.on("end quote", function () {
                    var quote = qemitter.global.store[0].join('');
                    emitter.global.text = emitter.global.text.slice(quote.length);
                    emitter.emit("next character", [quote, "quote"]);   
                });
            
                qemitter.emit("text ready", global.text.join(''));
            
                return true;
            }, global);
    
        emitter.on("escape", function (d, emitter) {
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
                        emitter.emit("literal character", [escaped, "literal"]);
                }
            
            }, global);
    
        emitter.on("literal character",  function (char, em, ev) {
                var global = this;
            
                if (Array.isArray(char) ) {
                    global.store[0].push(char[0]);            
                } else {
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
                            emitter.emit("close bracket", {rightbracket:char});
                        break;
                        case "'":
                        case "\"" :
                            emitter.emit("quote", char);
                        break;
                        case "\\" :
                            emitter.emit("escape");
                        break;
                    }
                }
            
                char = global.text.shift();
                if (char) {
                    emitter.emit("next character", char);
                } else {
                    emitter.emit("text processing done");
                }
            
            }, global, "store only" );
    
        emitter.once("text processing done",  function () {
                //emitter.log.print();
                console.log(global.store.map(function (el) {return el.join('');}) );
            }, global );
    
        return emitter;
    };

parserF().emit("text ready", "(cool, ( [great] right) yay!");

parserF().emit("text ready", "We shall use \\( just a little \\\\ \\t (some escaping \\( for \\) us) right?");

parserF().emit("text ready", "We (shall 'use' us \"ri(gh)t\")");