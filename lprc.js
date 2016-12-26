module.exports = function (Folder, args) {


    if (args.file.length === 0) {
        args.file = ["project.md"];
    }

    require('litpro-jshint')(Folder, args);
        
     Folder.sync("ife", function (code, args) {
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
     });

};
