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

    var text = "(cool, [great] right) yay!";

    emitter.emit("text ready", text);

### Start processing

Here we set it up once we have the bit of text.

We have a global variable to store state. The text passed in is split into an array to be shifted until it is empty. 


    function (text, emitter) {
        var global = {};

        global.store = [[]];
        global.original = text;
        global.text = text.split('');

        emitter.on("next character", _"store character", global); 

        emitter.on("open bracket", _"create new parenthetical", global);

        emitter.on("quote", _"quote processing", global);

        emitter.on("escape", _"escape character", global);

        emitter.on("text processing done", _"report processed", global);

        emitter.emit("next character", global.text.shift());

    }

### Store character

We get a new character and pop it into the globa store 0 array. Then we analyze it and emit the appropriate event, if any. After, we emit the next character or the done event.

    function (char) {
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

        handlers.close = emitter.when("close bracket", [_"end parenthetical", _"remove bracket handlers".bind(handlers)]).last;

        handlers.fail = emitter.on("text processing done", _"remove bracket handlers", handlers).last;


    }

## Remove bracket handlers

This is a cleanup action that removes handlers once all done

    function (d, emitter) {
        var handlers = this;

        emitter.off("next character", handlers.pusher);
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



    function () {

    }

### Escape character

    function () {

    }

### report processed

This is the end of the line. We have 

    function () {
        //emitter.log.print();
        console.log(global.store.map(function (el) {return el.join('');}) );
    }
