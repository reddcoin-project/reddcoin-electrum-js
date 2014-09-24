var abstract = require("./AbstractWallet");
var bip32 = require("./Bip32HdWallet");
var stampit = require('stampit');

module.exports = {
    standardWallet : function(){
        //return abstract.create();
        return stampit.compose(abstract, bip32).create();
    }
};


