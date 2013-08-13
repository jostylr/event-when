# Parsing

This is an example program on how to use event-when in parsing. This is not meant to be a serious parser method, but rather a different mode of seeing how events could be used. 

##[paren.js](#paren.js "save: |jshint")

Let's do a quick parser that creates a list of bracketed expressions. 

Each character gets an event, each opening bracket, each closing bracket, gets an event. 

The handlers keep track of what was parsed

    /*global require, console, process*/

    var EventWhen = require('../index.js');
    var emitter = new EventWhen();
    emitter.makeLog();

    emitter.on("next character"); 
