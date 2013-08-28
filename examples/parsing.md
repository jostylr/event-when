# Parsing

This is an example program on how to use event-when in parsing. This is not meant to be a serious parser method, but rather a different mode of seeing how events could be used. 

##[paren.js](#paren.js "save: |jshint")

Let's do a quick parser that creates a list of bracketed expressions. 

Each character gets an event, each opening bracket, each closing bracket, gets an event. 

The handlers keep track of what was parsed. 

Most of the handlers are defined in start processing to use closures. We could use emitter to store a global state, indexed by text. But I think it is cleaner to have a closure around the global. We could also initiate a new emitter for each new text. 

    /*global require, console*/

    var EventWhen = require('../index.js');

    var parserF =  _"make parser";

    parserF().emit("text ready", "(cool, ( [great] right) yay!");

    parserF().emit("text ready", "We shall use \\( just a little \\\\ \\t (some escaping \\( for \\) us) right?");

    parserF().emit("text ready", "We (shall 'use' us \"rig(ht\")");


### Make Parser

So we just create and return an emitter

    function () {
        var emitter = new EventWhen();
        emitter.makeLog();
        emitter.on("text ready", _"start processing");
        return emitter;
    }

### Start processing

Here we set it up once we have the bit of text.

We have a global variable to store state. The text passed in is split into an array to be shifted until it is empty. 


    function (text, emitter) {
        var global = {};

        global.store = [[]];
        global.original = text;
        global.text = text.split('');

        emitter.global = global;

        emitter.on("next character", [global, _"store character", "check"]);

        emitter.on("escape", [global, function () {
            this.store[0].pop(); // fix this later 
        }]);

        emitter.on("open bracket", [global, _"create new parenthetical"]);

        emitter.on("quote", [global, _"quote processing"]);

        emitter.on("escape", [global, _"escape character"]);

        emitter.on("literal character", [global, _"store character", "store only"]);

        emitter.once("text processing done", [global, _"report processed"]);

        emitter.emit("next character", global.text.shift());

    }

### Store character

We get a new character and pop it into the globa store 0 array. Then we analyze it and emit the appropriate event, if any. After, we emit the next character or the done event.

    function (char, em, ev) {
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

    }

### Create new parenthetical

For each parenthetical, we create a new array that will store everything that goes in it. We also record the brackets. 

    function (char) {
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
            if (Array.isArray(char) ) {
                this.push(char[0]);                
            } else {
                this.push(char);
            }
        }]).last;

        emitter.on("literal character", handlers.pusher);

        handlers.open = emitter.on("open bracket", function () {
            handlers.close.add("close bracket");
        });

        handlers.escaper = emitter.on("escape", [newstore, function () {
            this.pop(); // fix this later 
        }]);

        handlers.close = emitter.when("close bracket", [_"end parenthetical", [handlers, _"remove bracket handlers"]]).last;

        handlers.fail = emitter.on("text processing done", [handlers, _"remove bracket handlers"]).last;


    }

## Remove bracket handlers

This is a cleanup action that removes handlers once all done

    function (d, emitter) {
        var handlers = this;

        emitter.off("next character", handlers.pusher);
        emitter.off("literal character", handlers.pusher);
        emitter.off("escape character", handlers.escaper);

        handlers.close.cancel();
        emitter.off("text processing done", handlers.fail);

        return true;
    }


### End parenthetical

Check for a match? This is the problem of having an example without a reason.

    function (char) {
        rightbracket = char;
        if (brackets[leftbracket] !== rightbracket) {
            emitter.emit("mismatched brackets", [leftbracket+rightbracket, newstore.join('')]);
        } else {
            emitter.emit("matching brackets", newstore.join(''));
        }
    }

### Quote processing

For quotes, we do not want to parse the brackets. Quoting is considered a literal kind of thing. 

An easy way is to gobble up the rest of the text until a quote occurs. In more generality, one could intitate a separate parsing emitter that runs until it returns. So this is what we demonstrate here. We create a new emitter, strip away the bracket stuff, leave in the quoutes and look out for the original quote character.

    function (char, emitter) {
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
    }

### Escape character

We suck up the next character and check if it has any special meaning (tab, newline) and then either report the special character or report the literal. 

    function (d, emitter) {
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

    }

### report processed

This is the end of the line. We have 

    function () {
        //emitter.log.print();
        console.log(global.store.map(function (el) {return el.join('');}) );
    }
