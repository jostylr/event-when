/*global module*/
module.exports.same = function (inp, out) {
    var i, n = inp.length;

    if (inp.length !== out.length) {
        return inp.join("\n---\n"); 
    }

    for (i =0; i <n; i+=1 ) {
        if (inp[i] !== out[i]) {
            return "expected: "+out[i] + "\nactual: " +inp[i];
        }
    }
    return true;
};