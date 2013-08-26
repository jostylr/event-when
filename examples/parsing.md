# Parsing

This is an example program on how to use event-when in parsing. This is not meant to be a serious parser method, but rather a different mode of seeing how events could be used. 

##[paren.js](#paren.js "save: |jshint")

Let's do a quick parser that creates a list of bracketed expressions. 

Each character gets an event, each opening bracket, each closing bracket, gets an event. 

The handlers keep track of what was parsed. 

Most of the handlers are defined in start processing to use closures. We could use emitter to store a global state, indexed by text. But I think it is cleaner to have a closure around the global. We could also initiate a new emitter for each new text. 

    /*global require, console*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();


    emitter.on("text ready", _"start processing");

    var text = "(cool, ( [great] right) yay!";
    emitter.emit("text ready", text);

    var text2 = "We shall use \\( just a little \\\\ \\t (some escaping \\( for \\) us) right?";
    console.log(text2);
    emitter.emit("text ready", text2);

    //emitter.log.print();


### Start processing

Here we set it up once we have the bit of text.

We have a global variable to store state. The text passed in is split into an array to be shifted until it is empty. 


    function (text, emitter) {
        var global = {};

        global.store = [[]];
        global.original = text;
        global.text = text.split('');

        emitter.on("next character", [global, _"store character", "check"]); 

        emitter.on("open bracket", [global, _"create new parenthetical"]);

        emitter.on("quote", [global, _"quote processing"]);

        emitter.on("escape", [global, _"escape character"]);

        emitter.on("literal character", [global, _"store character", "store only"]);

        emitter.on("text processing done", [global, _"report processed"]);

        emitter.emit("next character", global.text.shift());

    }

### Store character

We get a new character and pop it into the globa store 0 array. Then we analyze it and emit the appropriate event, if any. After, we emit the next character or the done event.

    function (char, em, ev, command) {
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
            this.push(char);
        }]).last;

        emitter.on("literal character", handlers.pusher);

        handlers.open = emitter.on("open bracket", function () {
            handlers.close.add("close bracket");
        });

        handlers.close = emitter.when("close bracket", [_"end parenthetical", [handlers, _"remove bracket handlers"]).last;

        handlers.fail = emitter.on("text processing done", [handlers, _"remove bracket handlers"]).last;


    }

## Remove bracket handlers

This is a cleanup action that removes handlers once all done

    function (d, emitter) {
        var handlers = this;

        emitter.off("next character", handlers.pusher);
        emitter.off("literal character", handlers.pusher);

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

    function () {

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
                emitter.emit("literal character", escaped);
        }

    }

### report processed

This is the end of the line. We have 

    function () {
        //emitter.log.print();
        debugger;
        console.log(global.store.map(function (el) {return el.join('');}) );
    }
