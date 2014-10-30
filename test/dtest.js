global.dbg = function(item){
    console.log(item);
};

// Allows for debug versions of tests. For instance, if
//    test.strictEqual();
// is failing, you can add a "d" to the beginning to get better formatted debug output:
//    dtest.strictEqual();
// This is useful because with long addresses, hex strings, etc. its much easier to compare them when they're aligned.
module.exports = {

    strictEqual : function (a, b, m) {
        var m = m || "";
        console.log(m);
        console.log(a);
        console.log(b);
        console.log("");
    },

    deepEqual : function (a, b, m) {
        this.strictEqual(a, b, m);
    }
};