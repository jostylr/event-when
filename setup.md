# [event-when](# "version: 1.6.1; An event library that allows for the blocking of event firing thus dealing with many-to-one event firing")

This sets up the literate programming environment and other tools. 

* [../](# "cd: save")
* [lprc.js](#lprc.js "save:")
* [package.json](#npm-package "save:")
* [LICENSE](#license "save:")
* [.gitignore](#gitignore "save:")
* [.npmignore](#npmignore "save:")
* [.travis.yml](#travis "save:")
* [](# "cd: save")


## lprc.js

    module.exports = function (Folder, args) {


        if (args.file.length === 0) {
            args.file = ["project.md"];
        }

        require('litpro-jshint')(Folder, args);
            
         Folder.sync("ife", _"immediate function execution");

    };
  
### Immediate Function Execution

When writing this snippets of code everywhere, a problem arises as to where to
place the scope of the variables. How do we avoid temporary variables from
polluting the full scope? And how do we effectively write tests for such
snippets?

The solution is the immediate function expressions. If we enclose a snippet in
function () {} () then we get a nice enclosed scope. If we also want to add in
some parameters from the surrounding (say read-only parameters or something to
be evaluated into a closure for later use), then we can do that as well.

The syntax will be ife for the no parameter version and ife(v, w=hidethis) to
have parameters such as function(v,w) {} (v, hidethis) That is, the = is used
to rename an outer parameter into a different variable name while just a
single variable name is assumed to have the outer variable blocked.

This will is designed to detect whether it is a function or not (by first word
being function) and then return the function or simply execute the code. To
set the return value by piping, include return = text where text is what one
would write after the return: return text


    function (code, args) {
        var i, n = args.length;

        var internal = [];
        var external = [];
        var arg,ret; 

        for (i=0; i <n; i +=1 ) {
            arg = args[i] || "";
            arg = arg.split("=").map(function (el) {
                return el.trim();
            });
            if (arg[0] === "return") {
                ret = arg[1] || "";
            } else if (arg.length === 1) {
                internal.push(arg[0]);
                external.push(arg[0]);
            } else if (arg.length === 2) {
                internal.push(arg[0]);
                external.push(arg[1]);
            }

        }

        var start = "(function ( "+internal.join(", ")+" ) {";
        var end = "\n} ( "+external.join(",")+" ) )";

        if (typeof ret === "string") {
            return start + code + "\n return "+ret+";" + end;
        } else if (code.search(/^\s*function/) === -1) {
            return start + code + end;
        } else {
            return start + "\n return "+ code +";"+ end;
        }
    }


## NPM package

The requisite npm package file. 


    {
      "name": "_`g::docname`",
      "description": "_`g::tagline`",
      "version": "_`g::docversion`",
      "homepage": "https://github.com/_`g::gituser`/_`g::docname`",
      "author": {
        "name": "_`g::authorname`", "email": "_`g::authoremail`"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/_`g::gituser`/_`g::docname`.git"
      },
      "bugs": {
        "url": "https://github.com/_`g::gituser`/_`g::docname`/issues"
      },
      "license": "MIT",
      "main": "index.js",
      "engines": {
        "node": ">=0.10"
      },
      "dependencies":{
        _"g::npm dependencies"
      },
      "devDependencies" : {
        _"g::npm dev dependencies"
      },
      "scripts" : { 
        "test" : "node testrunner.js"
      },
      "keywords": ["event"]
    }

## Travis

A travis.yml file for continuous test integration!

    language: node_js
    node_js:
      - "node"
    sudo: false

## Gitignore


    ghpages
    node_modules
    .checksum
    old

## npmignore

Need very little for npm install; just index and the readme, license. 

    testrunner.js
    examples
    *.md
    build
    src
    .travis.yml
    lprc.js


## LICENSE 

    The MIT License (MIT)
    Copyright (c) _"g::year" _"g::authorname"

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.


by [James Taylor](https://github.com/jostylr "npminfo: jostylr@gmail.com ; 
    deps: ; 
    dev: litpro 0.13.0, litpro-jshint 0.3.1, tape 4.6.3 ")


