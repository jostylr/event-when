# Parsing

This is an example program on how to use event-when in parsing. This is not meant to be a serious parser method, but rather a different mode of seeing how events could be used. 

##[paren.js](#paren.js "save: |jshint")

Let's do a quick parser that creates a list of bracketed expressions. 

Each character gets an event, each opening bracket, each closing bracket, gets an event. 

The handlers keep track of what was parsed. 

Most of the handlers are defined in start processing to use closures. We could use emitter to store a global state, indexed by text. But I think it is cleaner to have a closure around the global. We could also initiate a new emitter for each new text. 

    /*global require, console, process*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();


    emitter.on("text ready", _"start processing");

    var text = "(cool, [great] right)";

    emitter.emit("text ready", text);

### Start processing

Here we set it up once we have the bit of text.

We have a global variable to store state. The text passed in is split into an array to be shifted until it is empty. 


    function (text, emitter) {
        var global = {};

        global.store = [[]];
        global.original = text;
        global.text = text.split();

        emitter.on("next character", _"store character"); 

        emitter.on("open bracket", _"create new parenthetical");

        emitter.on("quote", _"quote processing");

        emitter.on("escape", _"escape character");

        emitter.on("text processing done", _"report processed");

        emitter.emit("next character", global.text.shift());

    }

### Store character

We get a new character and pop it into the globa store 0 array. Then we analyze it and emit the appropriate event, if any. After, we emit the next character or the done event.

    function (char) {
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

    }

### Create new parenthetical

For each parenthetical, we create a new array that will store everything that goes in it. We also record the brackets. 

    function (char) {
        var newstore,
            close,
            fail, 
            leftbracket, 
            rightbracket;

        close = emitter.on("close bracket", _"end parenthetical");

        fail = emitter.on("text processing done, _"failed to match", "first");

    }

### End parenthetical

    function () {

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
        emitter.log.print();
        console.log(global.store);
    }
