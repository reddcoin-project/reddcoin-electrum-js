var abstract = require("./AbstractWallet");
var bip32 = require("./Bip32HdWallet");
var instantiable = require("../attributes/Instantiable");
var stampit = require('stampit');

module.exports = {
    standardWallet : function(){
        //return abstract.create();
        return stampit.compose(instantiable, abstract, bip32).create();
    }
};


